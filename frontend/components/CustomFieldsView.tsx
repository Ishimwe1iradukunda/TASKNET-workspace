import React, { useState, useEffect } from 'react';
import { Plus, ListPlus, Text, Hash, Calendar, ToggleRight, CheckSquare, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { CustomField, CreateCustomFieldRequest } from '~backend/workspace/custom-fields/create';

interface CustomFieldsViewProps {
  isOfflineMode: boolean;
}

export function CustomFieldsView({ isOfflineMode }: CustomFieldsViewProps) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newField, setNewField] = useState<Partial<CreateCustomFieldRequest>>({
    name: '',
    type: 'text',
    entityType: 'task',
    isRequired: false,
    options: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!isOfflineMode) {
      loadFields();
    }
  }, [isOfflineMode]);

  const loadFields = async () => {
    try {
      const response = await backend.workspace.listCustomFields({});
      setFields(response.fields);
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
      const created = await backend.workspace.createCustomField(newField as CreateCustomFieldRequest);
      setFields(prev => [...prev, created]);
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

  const groupedFields = fields.reduce((acc, field) => {
    (acc[field.entityType] = acc[field.entityType] || []).push(field);
    return acc;
  }, {} as Record<string, CustomField[]>);

  if (isOfflineMode) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <ListPlus className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Custom Fields Unavailable</h3>
        <p className="text-muted-foreground">
          Custom field management requires online mode.
        </p>
      </div>
    );
  }

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
              <div className="flex justify-end">
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
              <CardTitle className="capitalize">{entityType} Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {fields.map(field => (
                  <div key={field.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {getFieldIcon(field.type)}
                      <span className="font-medium">{field.name}</span>
                      {field.isRequired && <span className="text-red-500 text-xs">(Required)</span>}
                    </div>
                    <span className="text-sm text-muted-foreground capitalize">{field.type.replace('_', ' ')}</span>
                  </div>
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
    </div>
  );
}
