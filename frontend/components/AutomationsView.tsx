import React, { useState, useEffect } from 'react';
import { Plus, Zap, ToggleLeft, ToggleRight, Play, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import { LocalStorageManager } from '../utils/localStorage';

interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: string;
    conditions: Record<string, any>;
  };
  action: {
    type: string;
    parameters: Record<string, any>;
  };
  isActive: boolean;
  executionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface AutomationsViewProps {
  isOfflineMode: boolean;
}

export function AutomationsView({ isOfflineMode }: AutomationsViewProps) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAutomation, setNewAutomation] = useState<{
    name: string;
    description: string;
    trigger: { type: string; conditions: Record<string, any> };
    action: { type: string; parameters: Record<string, any> };
    isActive: boolean;
  }>({
    name: '',
    description: '',
    trigger: { type: 'task_created', conditions: {} },
    action: { type: 'send_notification', parameters: {} },
    isActive: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAutomations();
  }, [isOfflineMode]);

  const loadAutomations = async () => {
    try {
      if (isOfflineMode) {
        setAutomations(LocalStorageManager.getAutomations());
      } else {
        const response = await backend.workspace.listAutomations();
        setAutomations(response.automations);
      }
    } catch (error) {
      console.error('Failed to load automations:', error);
      toast({
        title: "Error",
        description: "Failed to load automations",
        variant: "destructive",
      });
    }
  };

  const createAutomation = async () => {
    if (!newAutomation.name || !newAutomation.trigger || !newAutomation.action) return;

    try {
      if (isOfflineMode) {
        const automation = LocalStorageManager.createAutomation({
          name: newAutomation.name,
          description: newAutomation.description,
          trigger: newAutomation.trigger,
          action: newAutomation.action,
          isActive: newAutomation.isActive,
        });
        setAutomations(prev => [automation, ...prev]);
      } else {
        const created = await backend.workspace.createAutomation(newAutomation);
        setAutomations(prev => [created, ...prev]);
      }
      setIsCreateDialogOpen(false);
      setNewAutomation({
        name: '',
        description: '',
        trigger: { type: 'task_created', conditions: {} },
        action: { type: 'send_notification', parameters: {} },
        isActive: true,
      });
      toast({
        title: "Success",
        description: "Automation created successfully",
      });
    } catch (error) {
      console.error('Failed to create automation:', error);
      toast({
        title: "Error",
        description: "Failed to create automation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automations</h2>
          <p className="text-muted-foreground">Automate your workflows and save time</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Automation</DialogTitle>
              <DialogDescription>
                Set up a new trigger and action to automate your workflow.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Automation Name"
                value={newAutomation.name}
                onChange={(e) => setNewAutomation(p => ({ ...p, name: e.target.value }))}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newAutomation.description}
                onChange={(e) => setNewAutomation(p => ({ ...p, description: e.target.value }))}
              />
              <div>
                <h4 className="font-medium mb-2">Trigger</h4>
                <Select
                  value={newAutomation.trigger?.type}
                  onValueChange={(value) => setNewAutomation(p => ({ ...p, trigger: { ...p.trigger!, type: value as any } }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task_created">Task Created</SelectItem>
                    <SelectItem value="task_status_change">Task Status Changed</SelectItem>
                    <SelectItem value="due_date_approaching">Due Date Approaching</SelectItem>
                    <SelectItem value="project_status_change">Project Status Changed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <h4 className="font-medium mb-2">Action</h4>
                <Select
                  value={newAutomation.action?.type}
                  onValueChange={(value) => setNewAutomation(p => ({ ...p, action: { ...p.action!, type: value as any } }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="send_notification">Send Notification</SelectItem>
                    <SelectItem value="update_status">Update Status</SelectItem>
                    <SelectItem value="assign_user">Assign User</SelectItem>
                    <SelectItem value="create_task">Create Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button onClick={createAutomation}>Create Automation</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {automations.map(automation => (
            <Card key={automation.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{automation.name}</CardTitle>
                    <CardDescription>{automation.description}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Trigger</span>
                  <span className="font-medium">{automation.trigger.type.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Action</span>
                  <span className="font-medium">{automation.action.type.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Executions</span>
                  <span className="font-medium">{automation.executionCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    {automation.isActive ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-green-500" /> Active
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-muted-foreground" /> Inactive
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {automations.length === 0 && (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No automations found</h3>
            <p className="text-muted-foreground">
              Create your first automation to streamline your work.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
