import React, { useState, useEffect } from 'react';
import { Clock, CheckSquare, FileText, FolderOpen, Mail, Calendar, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageManager } from '../utils/localStorage';

interface ActivityItem {
  id: string;
  type: 'task' | 'project' | 'note' | 'wiki' | 'email' | 'document';
  action: 'created' | 'updated' | 'completed' | 'deleted' | 'uploaded' | 'received';
  title: string;
  description?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ActivityFeedViewProps {
  isOfflineMode: boolean;
}

export function ActivityFeedView({ isOfflineMode }: ActivityFeedViewProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadActivityFeed();
  }, [isOfflineMode]);

  useEffect(() => {
    filterActivities();
  }, [activities, searchTerm, typeFilter, actionFilter]);

  const loadActivityFeed = async () => {
    try {
      if (isOfflineMode) {
        const tasks = LocalStorageManager.getTasks();
        const projects = LocalStorageManager.getProjects();
        const notes = LocalStorageManager.getNotes();
        const wikis = LocalStorageManager.getWikis();
        const emails = LocalStorageManager.getEmails();
        const documents = LocalStorageManager.getDocuments();

        const allActivities: ActivityItem[] = [
          ...tasks.map(task => ({
            id: `task-${task.id}`,
            type: 'task' as const,
            action: task.status === 'done' ? 'completed' as const : 'updated' as const,
            title: task.title,
            description: task.description,
            timestamp: task.updatedAt,
            metadata: { status: task.status, priority: task.priority },
          })),
          ...projects.map(project => ({
            id: `project-${project.id}`,
            type: 'project' as const,
            action: 'updated' as const,
            title: project.name,
            description: project.description,
            timestamp: project.updatedAt,
            metadata: { status: project.status },
          })),
          ...notes.map(note => ({
            id: `note-${note.id}`,
            type: 'note' as const,
            action: 'updated' as const,
            title: note.title,
            description: note.content.substring(0, 100) + '...',
            timestamp: note.updatedAt,
            metadata: { tags: note.tags },
          })),
          ...wikis.map(wiki => ({
            id: `wiki-${wiki.id}`,
            type: 'wiki' as const,
            action: 'updated' as const,
            title: wiki.title,
            description: wiki.content.substring(0, 100) + '...',
            timestamp: wiki.updatedAt,
            metadata: { tags: wiki.tags },
          })),
          ...emails.map(email => ({
            id: `email-${email.id}`,
            type: 'email' as const,
            action: 'received' as const,
            title: email.subject,
            description: `From: ${email.sender}`,
            timestamp: email.receivedAt,
            metadata: { sender: email.sender, isRead: email.isRead },
          })),
          ...documents.map(doc => ({
            id: `document-${doc.id}`,
            type: 'document' as const,
            action: 'uploaded' as const,
            title: doc.name,
            description: `${(doc.size / 1024 / 1024).toFixed(2)} MB`,
            timestamp: doc.createdAt,
            metadata: { fileType: doc.fileType, size: doc.size },
          })),
        ];

        // Sort by timestamp (newest first)
        allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        setActivities(allActivities);
      } else {
        // In online mode, would fetch from backend
        toast({
          title: "Offline Mode",
          description: "Activity feed is limited to local data in offline mode",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Failed to load activity feed:', error);
      toast({
        title: "Error",
        description: "Failed to load activity feed",
        variant: "destructive",
      });
    }
  };

  const filterActivities = () => {
    let filtered = activities;

    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === typeFilter);
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(activity => activity.action === actionFilter);
    }

    setFilteredActivities(filtered);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task': return CheckSquare;
      case 'project': return FolderOpen;
      case 'note': return FileText;
      case 'wiki': return FileText;
      case 'email': return Mail;
      case 'document': return Calendar;
      default: return Clock;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'created': return 'text-blue-600 bg-blue-50';
      case 'updated': return 'text-orange-600 bg-orange-50';
      case 'deleted': return 'text-red-600 bg-red-50';
      case 'uploaded': return 'text-purple-600 bg-purple-50';
      case 'received': return 'text-cyan-600 bg-cyan-50';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const groupActivitiesByDate = (activities: ActivityItem[]) => {
    const groups: { [date: string]: ActivityItem[] } = {};
    
    activities.forEach(activity => {
      const date = activity.timestamp.toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });

    return groups;
  };

  const activityGroups = groupActivitiesByDate(filteredActivities);

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Activity Feed</h2>
            <p className="text-muted-foreground">
              Track all changes and updates across your workspace
            </p>
          </div>
          <Badge variant="outline">
            {filteredActivities.length} activities
          </Badge>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="task">Tasks</SelectItem>
              <SelectItem value="project">Projects</SelectItem>
              <SelectItem value="note">Notes</SelectItem>
              <SelectItem value="wiki">Wiki Pages</SelectItem>
              <SelectItem value="email">Emails</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="updated">Updated</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
              <SelectItem value="uploaded">Uploaded</SelectItem>
              <SelectItem value="received">Received</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        {Object.entries(activityGroups).map(([date, dateActivities]) => (
          <div key={date} className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            
            <div className="space-y-3">
              {dateActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const colorClasses = getActivityColor(activity.action);
                
                return (
                  <Card key={activity.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${colorClasses}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{activity.title}</h4>
                            <Badge variant="outline" className="capitalize text-xs">
                              {activity.type}
                            </Badge>
                            <Badge variant="secondary" className="capitalize text-xs">
                              {activity.action}
                            </Badge>
                          </div>
                          
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {activity.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{formatTimeAgo(activity.timestamp)}</span>
                            <span>{activity.timestamp.toLocaleTimeString()}</span>
                            
                            {activity.metadata && (
                              <div className="flex gap-2">
                                {activity.metadata.status && (
                                  <Badge variant="outline" className="text-xs">
                                    {activity.metadata.status}
                                  </Badge>
                                )}
                                {activity.metadata.priority && (
                                  <Badge variant="outline" className="text-xs">
                                    {activity.metadata.priority} priority
                                  </Badge>
                                )}
                                {activity.metadata.tags && Array.isArray(activity.metadata.tags) && (
                                  activity.metadata.tags.slice(0, 2).map((tag: string) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
        
        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No activity found</h3>
            <p className="text-muted-foreground">
              {searchTerm || typeFilter !== 'all' || actionFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'Start creating tasks, notes, and projects to see activity here'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
