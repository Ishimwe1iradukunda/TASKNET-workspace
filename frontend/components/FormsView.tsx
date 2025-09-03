import React, { useState, useEffect } from 'react';
import { Plus, ClipboardList, X, Text, Mail, Hash, Calendar, CheckSquare, List, Eye, Edit, Trash2, BarChart3, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import { LocalStorageManager } from '../utils/localStorage';

interface Form {
  id: string;
  name: string;
  description?: string;
  fields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
  }>;
  submitAction: string;
  submissionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface FormsViewProps {
  isOfflineMode: boolean;
}

type FormField = {
  name: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date';
  label: string;
  required: boolean;
  options?: string[];
};

export function FormsView({ isOfflineMode }: FormsViewProps) {
  const [forms, setForms] = useState<Form[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [previewForm, setPreviewForm] = useState<Form | null>(null);
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [newForm, setNewForm] = useState<{
    name: string;
    description: string;
    fields: FormField[];
    submitAction: 'store_response' | 'create_task' | 'create_project';
  }>({
    name: '',
    description: '',
    fields: [{ name: 'field1', type: 'text', label: 'Field 1', required: false }],
    submitAction: 'store_response',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadForms();
  }, [isOfflineMode]);

  const loadForms = async () => {
    try {
      if (isOfflineMode) {
        setForms(LocalStorageManager.getForms());
      } else {
        const response = await backend.workspace.listForms();
        setForms(response.forms);
      }
    } catch (error) {
      console.error('Failed to load forms:', error);
      toast({ title: "Error", description: "Failed to load forms", variant: "destructive" });
    }
  };

  const createForm = async () => {
    if (!newForm.name || !newForm.fields || newForm.fields.length === 0) return;
    try {
      if (isOfflineMode) {
        const form = LocalStorageManager.createForm({
          name: newForm.name,
          description: newForm.description,
          fields: newForm.fields,
          submitAction: newForm.submitAction,
        });
        setForms(prev => [form, ...prev]);
      } else {
        const created = await backend.workspace.createForm(newForm);
        setForms(prev => [created, ...prev]);
      }
      setIsCreateDialogOpen(false);
      setNewForm({ name: '', description: '', fields: [{ name: 'field1', type: 'text', label: 'Field 1', required: false }], submitAction: 'store_response' });
      toast({ title: "Success", description: "Form created successfully" });
    } catch (error) {
      console.error('Failed to create form:', error);
      toast({ title: "Error", description: "Failed to create form", variant: "destructive" });
    }
  };

  const deleteForm = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    try {
      if (isOfflineMode) {
        LocalStorageManager.deleteForm(id);
        setForms(prev => prev.filter(f => f.id !== id));
      } else {
        // Would call backend delete API
        setForms(prev => prev.filter(f => f.id !== id));
      }
      toast({ title: "Success", description: "Form deleted successfully" });
    } catch (error) {
      console.error('Failed to delete form:', error);
      toast({ title: "Error", description: "Failed to delete form", variant: "destructive" });
    }
  };

  const addField = () => {
    const newField: FormField = { name: `field${(newForm.fields?.length || 0) + 1}`, type: 'text', label: `Field ${(newForm.fields?.length || 0) + 1}`, required: false };
    setNewForm(p => ({ ...p, fields: [...(p.fields || []), newField] }));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = [...(newForm.fields || [])];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setNewForm(p => ({ ...p, fields: updatedFields }));
  };

  const removeField = (index: number) => {
    const updatedFields = [...(newForm.fields || [])];
    updatedFields.splice(index, 1);
    setNewForm(p => ({ ...p, fields: updatedFields }));
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': case 'email': return <Text className="w-4 h-4" />;
      case 'number': return <Hash className="w-4 h-4" />;
      case 'date': return <Calendar className="w-4 h-4" />;
      case 'checkbox': return <CheckSquare className="w-4 h-4" />;
      case 'select': return <List className="w-4 h-4" />;
      case 'textarea': return <Text className="w-4 h-4" />;
      default: return <ClipboardList className="w-4 h-4" />;
    }
  };

  const renderFormPreview = (form: Form) => (
    <div className="space-y-4">
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold">{form.name}</h3>
        {form.description && <p className="text-muted-foreground">{form.description}</p>}
      </div>
      <div className="space-y-4">
        {form.fields.map((field, index) => (
          <div key={index} className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              {getFieldIcon(field.type)}
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <Textarea placeholder={`Enter ${field.label.toLowerCase()}`} disabled />
            ) : field.type === 'select' ? (
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === 'checkbox' ? (
              <div className="flex items-center space-x-2">
                <Checkbox disabled />
                <span className="text-sm">{field.label}</span>
              </div>
            ) : (
              <Input 
                type={field.type} 
                placeholder={`Enter ${field.label.toLowerCase()}`} 
                disabled 
              />
            )}
          </div>
        ))}
      </div>
      <div className="pt-4 border-t">
        <Button disabled className="w-full">Submit Form</Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Forms</h2>
          <p className="text-muted-foreground">Create and manage forms for data collection</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Form
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Create New Form</DialogTitle>
              <DialogDescription>
                Build a new form to collect data or trigger actions.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="builder" className="flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="builder">Form Builder</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="builder" className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                <Input placeholder="Form Name" value={newForm.name} onChange={(e) => setNewForm(p => ({ ...p, name: e.target.value }))} />
                <Textarea placeholder="Description (optional)" value={newForm.description} onChange={(e) => setNewForm(p => ({ ...p, description: e.target.value }))} />
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Fields</h4>
                    <Button variant="outline" size="sm" onClick={addField}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Field
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {newForm.fields?.map((field, index) => (
                      <Card key={index}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Field {index + 1}</span>
                            <Button variant="ghost" size="sm" onClick={() => removeField(index)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="Label" value={field.label} onChange={(e) => updateField(index, { label: e.target.value })} />
                            <Input placeholder="Name (no spaces)" value={field.name} onChange={(e) => updateField(index, { name: e.target.value.replace(/\s/g, '') })} />
                          </div>
                          <Select value={field.type} onValueChange={(v) => updateField(index, { type: v as any })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="textarea">Textarea</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                              <SelectItem value="checkbox">Checkbox</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                            </SelectContent>
                          </Select>
                          {(field.type === 'select') && (
                            <Input placeholder="Options (comma-separated)" onChange={(e) => updateField(index, { options: e.target.value.split(',').map(s => s.trim()) })} />
                          )}
                          <div className="flex items-center space-x-2">
                            <Checkbox id={`required-${index}`} checked={field.required} onCheckedChange={(c) => updateField(index, { required: !!c })} />
                            <label htmlFor={`required-${index}`} className="text-sm">Required</label>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Submit Action</h4>
                  <Select value={newForm.submitAction} onValueChange={(v) => setNewForm(p => ({ ...p, submitAction: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="store_response">Store Response</SelectItem>
                      <SelectItem value="create_task">Create Task</SelectItem>
                      <SelectItem value="create_project">Create Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                  <Button onClick={createForm}>Create Form</Button>
                </div>
              </TabsContent>
              <TabsContent value="preview" className="max-h-[70vh] overflow-y-auto">
                {renderFormPreview({
                  id: 'preview',
                  name: newForm.name || 'Form Preview',
                  description: newForm.description,
                  fields: newForm.fields,
                  submitAction: newForm.submitAction,
                  submissionCount: 0,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                })}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {forms.map(form => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{form.name}</CardTitle>
                    <CardDescription>{form.description}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setPreviewForm(form)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingForm(form)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteForm(form.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" />
                      Fields
                    </span>
                    <Badge variant="secondary">{form.fields.length}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Submissions
                    </span>
                    <Badge variant="outline">{form.submissionCount}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Action</span>
                    <Badge className="capitalize text-xs">{form.submitAction.replace('_', ' ')}</Badge>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex flex-wrap gap-1">
                      {form.fields.slice(0, 3).map((field, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {field.label}
                        </Badge>
                      ))}
                      {form.fields.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{form.fields.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {forms.length === 0 && (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No forms found</h3>
            <p className="text-muted-foreground">Create your first form to start collecting data.</p>
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      {previewForm && (
        <Dialog open={!!previewForm} onOpenChange={() => setPreviewForm(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Form Preview</DialogTitle>
              <DialogDescription>
                This is a preview of how your form will look to users.
              </DialogDescription>
            </DialogHeader>
            {renderFormPreview(previewForm)}
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editingForm && (
        <Dialog open={!!editingForm} onOpenChange={() => setEditingForm(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Edit Form</DialogTitle>
              <DialogDescription>
                Editing forms will be available in a future update.
              </DialogDescription>
            </DialogHeader>
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Form editing will be available in a future update.</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
