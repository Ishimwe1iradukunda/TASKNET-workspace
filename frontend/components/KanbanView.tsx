import React, { useState, useEffect } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageManager } from '../utils/localStorage';
import backend from '~backend/client';
import type { Task } from '~backend/workspace/tasks/create';

interface KanbanViewProps {
  isOfflineMode: boolean;
}

export function KanbanView({ isOfflineMode }: KanbanViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    tags: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'todo' as 'todo' | 'in-progress' | 'done',
  });
  const { toast } = useToast();

  const columns = [
    { id: 'todo', title: 'To Do', status: 'todo' as const },
    { id: 'in-progress', title: 'In Progress', status: 'in-progress' as const },
    { id: 'done', title: 'Done', status: 'done' as const },
  ];

  useEffect(() => {
    loadTasks();
  }, [isOfflineMode]);

  const loadTasks = async () => {
    try {
      if (isOfflineMode) {
        const localTasks = LocalStorageManager.getTasks();
        setTasks(localTasks);
      } else {
        const response = await backend.workspace.listTasks({});
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
          status: newTask.status,
        });
        setTasks(prev => [task, ...prev]);
      } else {
        const task = await backend.workspace.createTask({
          title: newTask.title,
          description: newTask.description || undefined,
          tags,
          priority: newTask.priority,
          status: newTask.status,
        });
        setTasks(prev => [task, ...prev]);
      }
      
      setNewTask({ title: '', description: '', tags: '', priority: 'medium', status: 'todo' });
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

  const updateTaskStatus = async (taskId: string, newStatus: 'todo' | 'in-progress' | 'done') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      if (isOfflineMode) {
        const updated = LocalStorageManager.updateTask(taskId, { status: newStatus });
        setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      } else {
        const updated = await backend.workspace.updateTask({
          id: taskId,
          status: newStatus,
        });
        setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      }
      
      toast({
        title: "Success",
        description: "Task status updated",
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: 'todo' | 'in-progress' | 'done') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    updateTaskStatus(taskId, status);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Kanban Board</h2>
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
                <DialogDescription>
                  Add a new task to your board. You can specify details like priority and status.
                </DialogDescription>
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
                  <Select value={newTask.status} onValueChange={(value: 'todo' | 'in-progress' | 'done') => 
                    setNewTask(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
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
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {columns.map((column) => {
            const columnTasks = tasks.filter(task => task.status === column.status);
            
            return (
              <div
                key={column.id}
                className="flex flex-col bg-muted/30 rounded-lg p-4"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                <h3 className="font-semibold mb-4 flex items-center justify-between">
                  {column.title}
                  <Badge variant="secondary">{columnTasks.length}</Badge>
                </h3>
                
                <div className="space-y-3 flex-1">
                  {columnTasks.map((task) => (
                    <Card
                      key={task.id}
                      className="cursor-move hover:shadow-md transition-shadow"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium line-clamp-2">
                            {task.title}
                          </CardTitle>
                          <Button variant="ghost" size="sm" className="h-auto p-1">
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {task.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                            {task.priority}
                          </Badge>
                          {task.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No tasks in {column.title.toLowerCase()}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
