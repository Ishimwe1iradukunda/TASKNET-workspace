import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, Clock, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageManager } from '../utils/localStorage';
import backend from '~backend/client';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "paused" | "completed" | "archived";
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectsViewProps {
  isOfflineMode: boolean;
}

export function ProjectsView({ isOfflineMode }: ProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'paused' | 'completed' | 'archived',
    startDate: '',
    endDate: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, [isOfflineMode, statusFilter]);

  const loadProjects = async () => {
    try {
      if (isOfflineMode) {
        const localProjects = LocalStorageManager.getProjects();
        let filtered = localProjects;
        
        if (statusFilter) {
          filtered = filtered.filter(project => project.status === statusFilter);
        }
        
        setProjects(filtered);
      } else {
        const response = await backend.workspace.listProjects({ 
          status: statusFilter || undefined 
        });
        setProjects(response.projects);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    }
  };

  const createProject = async () => {
    if (!newProject.name.trim()) return;
    
    try {
      if (isOfflineMode) {
        const project = LocalStorageManager.createProject({
          name: newProject.name,
          description: newProject.description || undefined,
          status: newProject.status,
          startDate: newProject.startDate ? new Date(newProject.startDate) : undefined,
          endDate: newProject.endDate ? new Date(newProject.endDate) : undefined,
        });
        setProjects(prev => [project, ...prev]);
      } else {
        const project = await backend.workspace.createProject({
          name: newProject.name,
          description: newProject.description || undefined,
          status: newProject.status,
          startDate: newProject.startDate ? new Date(newProject.startDate) : undefined,
          endDate: newProject.endDate ? new Date(newProject.endDate) : undefined,
        });
        setProjects(prev => [project, ...prev]);
      }
      
      setNewProject({ name: '', description: '', status: 'active', startDate: '', endDate: '' });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const updateProject = async (project: Project) => {
    try {
      if (isOfflineMode) {
        const updated = LocalStorageManager.updateProject(project.id, {
          name: project.name,
          description: project.description,
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate,
        });
        setProjects(prev => prev.map(p => p.id === project.id ? updated : p));
      } else {
        const updated = await backend.workspace.updateProject({
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate,
        });
        setProjects(prev => prev.map(p => p.id === project.id ? updated : p));
      }
      
      setEditingProject(null);
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    } catch (error) {
      console.error('Failed to update project:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const deleteProject = async (id: string) => {
    try {
      if (isOfflineMode) {
        LocalStorageManager.deleteProject(id);
        setProjects(prev => prev.filter(p => p.id !== id));
      } else {
        await backend.workspace.deleteProject({ id });
        setProjects(prev => prev.filter(p => p.id !== id));
      }
      
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'completed': return 'default';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Target className="w-4 h-4" />;
      case 'paused': return <Clock className="w-4 h-4" />;
      case 'completed': return <Target className="w-4 h-4" />;
      case 'archived': return <Users className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Projects</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Project name"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                />
                <Textarea
                  placeholder="Project description (optional)"
                  rows={3}
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                />
                <div className="grid grid-cols-3 gap-4">
                  <Select value={newProject.status} onValueChange={(value: 'active' | 'paused' | 'completed' | 'archived') => 
                    setNewProject(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    placeholder="Start date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                  <Input
                    type="date"
                    placeholder="End date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createProject} disabled={!newProject.name.trim()}>
                    Create Project
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
              placeholder="Search projects..."
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
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="h-fit">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2 mb-2">{project.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(project.status)} className="flex items-center gap-1">
                        {getStatusIcon(project.status)}
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingProject(project)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteProject(project.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {project.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  {project.startDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Started {new Date(project.startDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {project.endDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Due {new Date(project.endDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Create your first project to get started'}
            </p>
          </div>
        )}
      </div>
      
      {editingProject && (
        <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Project name"
                value={editingProject.name}
                onChange={(e) => setEditingProject(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
              <Textarea
                placeholder="Project description"
                rows={3}
                value={editingProject.description || ''}
                onChange={(e) => setEditingProject(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
              <div className="grid grid-cols-3 gap-4">
                <Select 
                  value={editingProject.status} 
                  onValueChange={(value: 'active' | 'paused' | 'completed' | 'archived') => 
                    setEditingProject(prev => prev ? { ...prev, status: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={editingProject.startDate ? new Date(editingProject.startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingProject(prev => prev ? { 
                    ...prev, 
                    startDate: e.target.value ? new Date(e.target.value) : undefined 
                  } : null)}
                />
                <Input
                  type="date"
                  value={editingProject.endDate ? new Date(editingProject.endDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingProject(prev => prev ? { 
                    ...prev, 
                    endDate: e.target.value ? new Date(e.target.value) : undefined 
                  } : null)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => updateProject(editingProject)}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingProject(null)}>
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
