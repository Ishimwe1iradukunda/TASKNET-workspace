import React, { useState, useEffect } from 'react';
import { Plus, Target, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

interface Goal {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  dueDate?: Date;
  projectId?: string;
  progress: number;
  status: "not_started" | "in_progress" | "completed" | "overdue";
  createdAt: Date;
  updatedAt: Date;
}

interface GoalsViewProps {
  isOfflineMode: boolean;
}

export function GoalsView({ isOfflineMode }: GoalsViewProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetValue: '',
    unit: '',
    dueDate: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!isOfflineMode) {
      loadGoals();
    }
  }, [isOfflineMode]);

  const loadGoals = async () => {
    try {
      const response = await backend.workspace.listGoals({});
      setGoals(response.goals);
    } catch (error) {
      console.error('Failed to load goals:', error);
      toast({
        title: "Error",
        description: "Failed to load goals",
        variant: "destructive",
      });
    }
  };

  const createGoal = async () => {
    if (!newGoal.title.trim() || !newGoal.targetValue || !newGoal.unit.trim()) return;
    
    try {
      const goal = await backend.workspace.createGoal({
        title: newGoal.title,
        description: newGoal.description || undefined,
        targetValue: parseFloat(newGoal.targetValue),
        unit: newGoal.unit,
        dueDate: newGoal.dueDate ? new Date(newGoal.dueDate) : undefined,
      });
      setGoals(prev => [goal, ...prev]);
      setNewGoal({ title: '', description: '', targetValue: '', unit: '', dueDate: '' });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Goal created successfully",
      });
    } catch (error) {
      console.error('Failed to create goal:', error);
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'overdue': return 'destructive';
      case 'not_started': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <TrendingUp className="w-4 h-4" />;
      case 'overdue': return <Calendar className="w-4 h-4" />;
      case 'not_started': return <Target className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (isOfflineMode) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Goals</h2>
          <p className="text-muted-foreground">Track and achieve your objectives</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Goals Unavailable</h3>
            <p className="text-muted-foreground">
              Goal tracking requires online mode to function properly.
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
          <h2 className="text-2xl font-bold">Goals</h2>
          <p className="text-muted-foreground">Track and achieve your objectives</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set a new objective to track your progress.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Goal title"
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Goal description (optional)"
                rows={3}
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Target value"
                  value={newGoal.targetValue}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetValue: e.target.value }))}
                />
                <Input
                  placeholder="Unit (e.g., hours, tasks)"
                  value={newGoal.unit}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Due Date (optional)</label>
                <Input
                  type="date"
                  value={newGoal.dueDate}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createGoal} disabled={!newGoal.title.trim() || !newGoal.targetValue || !newGoal.unit.trim()}>
                  Create Goal
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
          {goals.map(goal => (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getStatusColor(goal.status)} className="flex items-center gap-1">
                        {getStatusIcon(goal.status)}
                        {goal.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {goal.description && (
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  )}
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <div className="text-right mt-1">
                      <span className="text-sm font-medium">{Math.round(goal.progress)}%</span>
                    </div>
                  </div>
                  
                  {goal.dueDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Due {new Date(goal.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {goals.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No goals found</h3>
            <p className="text-muted-foreground">
              Create your first goal to start tracking progress
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
