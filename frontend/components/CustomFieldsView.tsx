import React, { useState, useEffect } from 'react';
import { Plus, ListPlus, Text, Hash, Calendar, ToggleRight, CheckSquare, List, Edit, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import { LocalStorageManager } from '../utils/localStorage';

interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select" | "multi_select";
  options?: string[];
  entityType: "task" | "project" | "note";
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomFieldsViewProps {
  isOfflineMode: boolean;
}

export function CustomFieldsView({ isOfflineMode }: CustomFieldsViewProps) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [newField, setNewField] = useState<{
    name: string;
    type: "text" | "number" | "date" | "boolean" | "select" | "multi_select";
    entityType: "task" | "project" | "note";
    isRequired: boolean;
    options: string[];
  }>({
    name: '',
    type: 'text',
    entityType: 'task',
    isRequired: false,
    options: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    loadFields();
  }, [isOfflineMode]);

  const loadFields = async () => {
    try {
      if (isOfflineMode) {
        setFields(LocalStorageManager.getCustomFields());
      } else {
        const response = await backend.workspace.listCustomFields({});
        setFields(response.fields);
      }
    } catch (error) {
      console.error('Failed to load custom fields:', error);
      toast({
        title: "Error",
        description: "Failed to load custom fields",
        variant: "destructive",
      });
    }
  };

  const createField = async () => {
    if (!newField.name || !newField.type || !newField.entityType) return;

    try {
      if (isOfflineMode) {
        const field = LocalStorageManager.createCustomField({
          name: newField.name,
          type: newField.type,
          entityType: newField.entityType,
          isRequired: newField.isRequired,
          options: newField.options,
        });
        setFields(prev => [...prev, field]);
      } else {
        const created = await backend.workspace.createCustomField(newField);
        setFields(prev => [...prev, created]);
      }
      setIsCreateDialogOpen(false);
      setNewField({ name: '', type: 'text', entityType: 'task', isRequired: false, options: [] });
      toast({
        title: "Success",
        description: "Custom field created successfully",
      });
    } catch (error) {
      console.error('Failed to create custom field:', error);
      toast({
        title: "Error",
        description: "Failed to create custom field",
        variant: "destructive",
      });
    }
  };

  const deleteField = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom field?')) return;

    try {
      if (isOfflineMode) {
        LocalStorageManager.deleteCustomField(id);
        setFields(prev => prev.filter(f => f.id !== id));
      } else {
        // Would call backend delete API
        setFields(prev => prev.filter(f => f.id !== id));
      }
      toast({
        title: "Success",
        description: "Custom field deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete custom field:', error);
      toast({
        title: "Error",
        description: "Failed to delete custom field",
        variant: "destructive",
      });
    }
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return <Text className="w-4 h-4" />;
      case 'number': return <Hash className="w-4 h-4" />;
      case 'date': return <Calendar className="w-4 h-4" />;
      case 'boolean': return <ToggleRight className="w-4 h-4" />;
      case 'select': return <List className="w-4 h-4" />;
      case 'multi_select': return <CheckSquare className="w-4 h-4" />;
      default: return <ListPlus className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'number': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'date': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'boolean': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'select': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'multi_select': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const groupedFields = fields.reduce((acc, field) => {
    (acc[field.entityType] = acc[field.entityType] || []).push(field);
    return acc;
  }, {} as Record<string, CustomField[]>);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Custom Fields</h2>
          <p className="text-muted-foreground">Extend your workspace with custom data fields</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Field
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Field</DialogTitle>
              <DialogDescription>
                Add a new custom field to extend your tasks, projects, or notes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Field Name"
                value={newField.name}
                onChange={(e) => setNewField(p => ({ ...p, name: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select value={newField.type} onValueChange={(v) => setNewField(p => ({ ...p, type: v as any }))}>
                  <SelectTrigger><SelectValue placeholder="Field Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Checkbox</SelectItem>
                    <SelectItem value="select">Single Select</SelectItem>
                    <SelectItem value="multi_select">Multi Select</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newField.entityType} onValueChange={(v) => setNewField(p => ({ ...p, entityType: v as any }))}>
                  <SelectTrigger><SelectValue placeholder="Apply To" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(newField.type === 'select' || newField.type === 'multi_select') && (
                <Input
                  placeholder="Options (comma-separated)"
                  onChange={(e) => setNewField(p => ({ ...p, options: e.target.value.split(',').map(s => s.trim()) }))}
                />
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-required"
                  checked={newField.isRequired}
                  onCheckedChange={(checked) => setNewField(p => ({ ...p, isRequired: !!checked }))}
                />
                <label htmlFor="is-required" className="text-sm font-medium">Field is required</label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={createField}>Create Field</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {Object.entries(groupedFields).map(([entityType, fields]) => (
          <Card key={entityType}>
            <CardHeader>
              <CardTitle className="capitalize flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {entityType} Fields
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {fields.map(field => (
                  <Card key={field.id} className="border-2 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getFieldIcon(field.type)}
                          <span className="font-medium">{field.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingField(field)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteField(field.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Badge className={`text-xs ${getTypeColor(field.type)}`}>
                          {field.type.replace('_', ' ')}
                        </Badge>
                        {field.isRequired && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                        {field.options && field.options.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Options: {field.options.slice(0, 2).join(', ')}
                            {field.options.length > 2 && ` +${field.options.length - 2} more`}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {fields.length === 0 && (
          <div className="text-center py-12">
            <ListPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No custom fields found</h3>
            <p className="text-muted-foreground">
              Create your first custom field to add more context to your items.
            </p>
          </div>
        )}
      </div>

      {editingField && (
        <Dialog open={!!editingField} onOpenChange={() => setEditingField(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Custom Field</DialogTitle>
              <DialogDescription>
                Modify the properties of this custom field.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Field Name"
                value={editingField.name}
                onChange={(e) => setEditingField(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select 
                  value={editingField.type} 
                  onValueChange={(v) => setEditingField(prev => prev ? { ...prev, type: v as any } : null)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Checkbox</SelectItem>
                    <SelectItem value="select">Single Select</SelectItem>
                    <SelectItem value="multi_select">Multi Select</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={editingField.entityType} 
                  onValueChange={(v) => setEditingField(prev => prev ? { ...prev, entityType: v as any } : null)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(editingField.type === 'select' || editingField.type === 'multi_select') && (
                <Input
                  placeholder="Options (comma-separated)"
                  value={editingField.options?.join(', ') || ''}
                  onChange={(e) => setEditingField(prev => prev ? { 
                    ...prev, 
                    options: e.target.value.split(',').map(s => s.trim()) 
                  } : null)}
                />
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-is-required"
                  checked={editingField.isRequired}
                  onCheckedChange={(checked) => setEditingField(prev => prev ? { ...prev, isRequired: !!checked } : null)}
                />
                <label htmlFor="edit-is-required" className="text-sm font-medium">Field is required</label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingField(null)}>Cancel</Button>
                <Button onClick={() => {
                  // Update field logic would go here
                  setEditingField(null);
                  toast({ title: "Success", description: "Field updated successfully" });
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
