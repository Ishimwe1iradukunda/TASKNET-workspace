import React, { useState, useEffect } from 'react';
import { Calendar, CheckSquare, Clock, Target, TrendingUp, Users, FileText, AlertCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageManager } from '../utils/localStorage';
import backend from '~backend/client';

interface DashboardViewProps {
  isOfflineMode: boolean;
}

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  overdueTasks: number;
  totalProjects: number;
  activeProjects: number;
  totalNotes: number;
  totalTime: number;
  todayTasks: number;
  weekTasks: number;
}

interface RecentActivity {
  id: string;
  type: 'task' | 'project' | 'note';
  action: 'created' | 'updated' | 'completed';
  title: string;
  timestamp: Date;
}

export function DashboardView({ isOfflineMode }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    completedTasks: 0,
    activeTasks: 0,
    overdueTasks: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalNotes: 0,
    totalTime: 0,
    todayTasks: 0,
    weekTasks: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [quickActions] = useState([
    { icon: CheckSquare, label: 'New Task', action: 'tasks' },
    { icon: FileText, label: 'New Note', action: 'notes' },
    { icon: Target, label: 'New Project', action: 'projects' },
    { icon: Clock, label: 'Start Timer', action: 'time-tracking' },
  ]);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, [isOfflineMode]);

  const loadDashboardData = async () => {
    try {
      if (isOfflineMode) {
        const tasks = LocalStorageManager.getTasks();
        const projects = LocalStorageManager.getProjects();
        const notes = LocalStorageManager.getNotes();
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
        
        const completedTasks = tasks.filter(t => t.status === 'done').length;
        const activeTasks = tasks.filter(t => t.status !== 'done').length;
        const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length;
        const todayTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === today.toDateString()).length;
        const weekTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) >= weekStart && new Date(t.dueDate) < new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000))).length;
        
        setStats({
          totalTasks: tasks.length,
          completedTasks,
          activeTasks,
          overdueTasks,
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.status === 'active').length,
          totalNotes: notes.length,
          totalTime: 0, // Would need time tracking data
          todayTasks,
          weekTasks,
        });

        // Generate mock recent activity
        const mockActivity: RecentActivity[] = [
          ...tasks.slice(0, 3).map(task => ({
            id: task.id,
            type: 'task' as const,
            action: task.status === 'done' ? 'completed' as const : 'updated' as const,
            title: task.title,
            timestamp: task.updatedAt,
          })),
          ...projects.slice(0, 2).map(project => ({
            id: project.id,
            type: 'project' as const,
            action: 'updated' as const,
            title: project.name,
            timestamp: project.updatedAt,
          })),
          ...notes.slice(0, 2).map(note => ({
            id: note.id,
            type: 'note' as const,
            action: 'updated' as const,
            title: note.title,
            timestamp: note.updatedAt,
          })),
        ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);

        setRecentActivity(mockActivity);
      } else {
        // In online mode, we would fetch from backend
        // For now, showing offline message
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    }
  };

  const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task': return CheckSquare;
      case 'project': return Target;
      case 'note': return FileText;
      default: return AlertCircle;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'completed': return 'text-green-600';
      case 'created': return 'text-blue-600';
      case 'updated': return 'text-orange-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome back! Here's your productivity overview.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <action.icon className="w-8 h-8 mb-2 text-primary" />
                  <span className="text-sm font-medium">{action.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeTasks} active, {stats.completedTasks} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(completionRate)}%</div>
                <Progress value={completionRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeProjects}</div>
                <p className="text-xs text-muted-foreground">
                  of {stats.totalProjects} total projects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Knowledge Base</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalNotes}</div>
                <p className="text-xs text-muted-foreground">
                  notes & wiki pages
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Due Today</span>
                  <Badge variant={stats.todayTasks > 0 ? 'destructive' : 'secondary'}>
                    {stats.todayTasks}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Due This Week</span>
                  <Badge variant="outline">{stats.weekTasks}</Badge>
                </div>
                {stats.overdueTasks > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-600">Overdue</span>
                    <Badge variant="destructive">{stats.overdueTasks}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          <span className={getActivityColor(activity.action)}>
                            {activity.action}
                          </span>{' '}
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                {recentActivity.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Productivity Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Productivity Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.overdueTasks > 0 && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-800 mb-1">Overdue Tasks</h4>
                  <p className="text-sm text-red-600">
                    You have {stats.overdueTasks} overdue tasks. Consider reviewing your priorities.
                  </p>
                </div>
              )}
              
              {completionRate >= 80 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-1">Great Progress!</h4>
                  <p className="text-sm text-green-600">
                    You've completed {Math.round(completionRate)}% of your tasks. Keep it up!
                  </p>
                </div>
              )}
              
              {stats.totalNotes > 10 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-1">Knowledge Builder</h4>
                  <p className="text-sm text-blue-600">
                    You have {stats.totalNotes} notes. Consider organizing them into wikis.
                  </p>
                </div>
              )}
              
              {stats.activeProjects === 0 && stats.totalTasks > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-1">Organization Tip</h4>
                  <p className="text-sm text-yellow-600">
                    Group related tasks into projects for better organization.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
