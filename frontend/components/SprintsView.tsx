import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Target, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

interface Sprint {
  id: string;
  name: string;
  projectId: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  capacity?: number;
  status: "planning" | "active" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

interface SprintsViewProps {
  isOfflineMode: boolean;
}

export function SprintsView({ isOfflineMode }: SprintsViewProps) {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSprint, setNewSprint] = useState({
    name: '',
    projectId: '',
    goal: '',
    startDate: '',
    endDate: '',
    capacity: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!isOfflineMode) {
      loadSprints();
    }
  }, [isOfflineMode]);

  const loadSprints = async () => {
    try {
      const response = await backend.workspace.listSprints({});
      setSprints(response.sprints);
    } catch (error) {
      console.error('Failed to load sprints:', error);
      toast({
        title: "Error",
        description: "Failed to load sprints",
        variant: "destructive",
      });
    }
  };

  const createSprint = async () => {
    if (!newSprint.name.trim() || !newSprint.startDate || !newSprint.endDate) return;
    
    try {
      const sprint = await backend.workspace.createSprint({
        name: newSprint.name,
        projectId: newSprint.projectId,
        goal: newSprint.goal || undefined,
        startDate: new Date(newSprint.startDate),
        endDate: new Date(newSprint.endDate),
        capacity: newSprint.capacity ? parseInt(newSprint.capacity) : undefined,
      });
      setSprints(prev => [sprint, ...prev]);
      setNewSprint({ name: '', projectId: '', goal: '', startDate: '', endDate: '', capacity: '' });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Sprint created successfully",
      });
    } catch (error) {
      console.error('Failed to create sprint:', error);
      toast({
        title: "Error",
        description: "Failed to create sprint",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'secondary';
      case 'active': return 'default';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return <Calendar className="w-4 h-4" />;
      case 'active': return <Zap className="w-4 h-4" />;
      case 'completed': return <Target className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  if (isOfflineMode) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Sprints</h2>
          <p className="text-muted-foreground">Manage agile sprints and iterations</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Zap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Sprints Unavailable</h3>
            <p className="text-muted-foreground">
              Sprint management requires online mode to function properly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sprints</h2>
          <p className="text-muted-foreground">Manage agile sprints and iterations</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Sprint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Sprint</DialogTitle>
              <DialogDescription>
                Plan a new sprint for your agile workflow.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Sprint name"
                value={newSprint.name}
                onChange={(e) => setNewSprint(prev => ({ ...prev, name: e.target.value }))}
              />
              <Select value={newSprint.projectId} onValueChange={(value) => setNewSprint(prev => ({ ...prev, projectId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project1">Project 1</SelectItem>
                  <SelectItem value="project2">Project 2</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Sprint goal (optional)"
                rows={2}
                value={newSprint.goal}
                onChange={(e) => setNewSprint(prev => ({ ...prev, goal: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={newSprint.startDate}
                    onChange={(e) => setNewSprint(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={newSprint.endDate}
                    onChange={(e) => setNewSprint(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <Input
                type="number"
                placeholder="Capacity (hours)"
                value={newSprint.capacity}
                onChange={(e) => setNewSprint(prev => ({ ...prev, capacity: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button onClick={createSprint} disabled={!newSprint.name.trim() || !newSprint.startDate || !newSprint.endDate}>
                  Create Sprint
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sprints.map(sprint => (
            <Card key={sprint.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{sprint.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getStatusColor(sprint.status)} className="flex items-center gap-1">
                        {getStatusIcon(sprint.status)}
                        {sprint.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sprint.goal && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Goal</h4>
                      <p className="text-sm text-muted-foreground">{sprint.goal}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Start:</span>
                      <div className="text-muted-foreground">
                        {new Date(sprint.startDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">End:</span>
                      <div className="text-muted-foreground">
                        {new Date(sprint.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {sprint.capacity && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Capacity:</span>
                      <span className="text-muted-foreground">{sprint.capacity}h</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {sprints.length === 0 && (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No sprints found</h3>
            <p className="text-muted-foreground">
              Create your first sprint to start agile planning
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
