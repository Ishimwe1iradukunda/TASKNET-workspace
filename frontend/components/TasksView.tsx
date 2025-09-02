import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageManager } from '../utils/localStorage';
import backend from '~backend/client';
import type { Task } from '~backend/workspace/tasks/create';

interface TasksViewProps {
  isOfflineMode: boolean;
}

export function TasksView({ isOfflineMode }: TasksViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    tags: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, [isOfflineMode, statusFilter]);

  const loadTasks = async () => {
    try {
      if (isOfflineMode) {
        const localTasks = LocalStorageManager.getTasks();
        let filtered = localTasks;
        
        if (statusFilter) {
          filtered = filtered.filter(task => task.status === statusFilter);
        }
        
        setTasks(filtered);
      } else {
        const response = await backend.workspace.listTasks({ 
          status: statusFilter || undefined 
        });
        setTasks(response.tasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    }
  };

  const createTask = async () => {
    if (!newTask.title.trim()) return;
    
    const tags = newTask.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    
    try {
      if (isOfflineMode) {
        const task = LocalStorageManager.createTask({
          title: newTask.title,
          description: newTask.description || undefined,
          tags,
          priority: newTask.priority,
          dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
        });
        setTasks(prev => [task, ...prev]);
      } else {
        const task = await backend.workspace.createTask({
          title: newTask.title,
          description: newTask.description || undefined,
          tags,
          priority: newTask.priority,
          dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
        });
        setTasks(prev => [task, ...prev]);
      }
      
      setNewTask({ title: '', description: '', tags: '', priority: 'medium', dueDate: '' });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      console.error('Failed to create task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const updateTask = async (task: Task) => {
    try {
      if (isOfflineMode) {
        const updated = LocalStorageManager.updateTask(task.id, {
          title: task.title,
          description: task.description,
          tags: task.tags,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        });
        setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      } else {
        const updated = await backend.workspace.updateTask({
          id: task.id,
          title: task.title,
          description: task.description,
          tags: task.tags,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        });
        setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      }
      
      setEditingTask(null);
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTask({ ...task, status: newStatus });
  };

  const deleteTask = async (id: string) => {
    try {
      if (isOfflineMode) {
        LocalStorageManager.deleteTask(id);
        setTasks(prev => prev.filter(t => t.id !== id));
      } else {
        await backend.workspace.deleteTask({ id });
        setTasks(prev => prev.filter(t => t.id !== id));
      }
      
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'default';
      case 'in-progress': return 'secondary';
      case 'todo': return 'outline';
      default: return 'outline';
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Tasks</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Task description (optional)"
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={newTask.priority} onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setNewTask(prev => ({ ...prev, priority: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <Input
                  placeholder="Tags (comma-separated)"
                  value={newTask.tags}
                  onChange={(e) => setNewTask(prev => ({ ...prev, tags: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Button onClick={createTask} disabled={!newTask.title.trim()}>
                    Create Task
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="">All statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={task.status === 'done'}
                      onCheckedChange={() => toggleTaskStatus(task)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <CardTitle className={`text-lg ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </CardTitle>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTask(task)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={getStatusColor(task.status)}>
                      {task.status.replace('-', ' ')}
                    </Badge>
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority} priority
                    </Badge>
                    {task.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No tasks found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Create your first task to get started'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Task title"
                value={editingTask.title}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
              <Textarea
                placeholder="Task description"
                rows={3}
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
              <div className="grid grid-cols-3 gap-4">
                <Select 
                  value={editingTask.status} 
                  onValueChange={(value: 'todo' | 'in-progress' | 'done') => 
                    setEditingTask(prev => prev ? { ...prev, status: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={editingTask.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setEditingTask(prev => prev ? { ...prev, priority: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingTask(prev => prev ? { 
                    ...prev, 
                    dueDate: e.target.value ? new Date(e.target.value) : undefined 
                  } : null)}
                />
              </div>
              <Input
                placeholder="Tags (comma-separated)"
                value={editingTask.tags.join(', ')}
                onChange={(e) => setEditingTask(prev => prev ? { 
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                } : null)}
              />
              <div className="flex gap-2">
                <Button onClick={() => updateTask(editingTask)}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingTask(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
