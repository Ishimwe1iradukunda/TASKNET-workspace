import React, { useState, useEffect } from 'react';
import { Plus, ClipboardList, X, Text, Mail, Hash, Calendar, CheckSquare, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { Form, CreateFormRequest } from '~backend/workspace/forms/create';

interface FormsViewProps {
  isOfflineMode: boolean;
}

type FormField = CreateFormRequest['fields'][0];

export function FormsView({ isOfflineMode }: FormsViewProps) {
  const [forms, setForms] = useState<Form[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newForm, setNewForm] = useState<Partial<CreateFormRequest>>({
    name: '',
    description: '',
    fields: [{ name: 'field1', type: 'text', label: 'Field 1', required: false }],
    submitAction: 'store_response',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!isOfflineMode) {
      loadForms();
    }
  }, [isOfflineMode]);

  const loadForms = async () => {
    try {
      const response = await backend.workspace.listForms();
      setForms(response.forms);
    } catch (error) {
      console.error('Failed to load forms:', error);
      toast({ title: "Error", description: "Failed to load forms", variant: "destructive" });
    }
  };

  const createForm = async () => {
    if (!newForm.name || !newForm.fields || newForm.fields.length === 0) return;
    try {
      const created = await backend.workspace.createForm(newForm as CreateFormRequest);
      setForms(prev => [created, ...prev]);
      setIsCreateDialogOpen(false);
      setNewForm({ name: '', description: '', fields: [{ name: 'field1', type: 'text', label: 'Field 1', required: false }], submitAction: 'store_response' });
      toast({ title: "Success", description: "Form created successfully" });
    } catch (error) {
      console.error('Failed to create form:', error);
      toast({ title: "Error", description: "Failed to create form", variant: "destructive" });
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

  if (isOfflineMode) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <ClipboardList className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Forms Unavailable</h3>
        <p className="text-muted-foreground">Form management requires online mode.</p>
      </div>
    );
  }

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
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
              <Input placeholder="Form Name" value={newForm.name} onChange={(e) => setNewForm(p => ({ ...p, name: e.target.value }))} />
              <Textarea placeholder="Description (optional)" value={newForm.description} onChange={(e) => setNewForm(p => ({ ...p, description: e.target.value }))} />
              
              <h4 className="font-medium">Fields</h4>
              <div className="space-y-3">
                {newForm.fields?.map((field, index) => (
                  <div key={index} className="p-3 border rounded-md space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Field {index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeField(index)}><X className="w-4 h-4" /></Button>
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
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={addField}>Add Field</Button>

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
              <div className="flex justify-end">
                <Button onClick={createForm}>Create Form</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {forms.map(form => (
            <Card key={form.id}>
              <CardHeader>
                <CardTitle>{form.name}</CardTitle>
                <CardDescription>{form.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fields</span>
                  <span>{form.fields.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Submissions</span>
                  <span>{form.submissionCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Action</span>
                  <span className="capitalize">{form.submitAction.replace('_', ' ')}</span>
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
    </div>
  );
}
