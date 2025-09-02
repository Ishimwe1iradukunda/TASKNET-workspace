import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

interface TimeEntry {
  id: string;
  taskId?: string;
  projectId?: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  isRunning: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TimeTrackingViewProps {
  isOfflineMode: boolean;
}

export function TimeTrackingView({ isOfflineMode }: TimeTrackingViewProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [description, setDescription] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!isOfflineMode) {
      loadTimeEntries();
    }
  }, [isOfflineMode]);

  const loadTimeEntries = async () => {
    try {
      const response = await backend.workspace.listTimeEntries({});
      setEntries(response.entries);
      const running = response.entries.find(e => e.isRunning);
      if (running) {
        setActiveEntry(running);
      }
    } catch (error) {
      console.error('Failed to load time entries:', error);
      toast({
        title: "Error",
        description: "Failed to load time entries",
        variant: "destructive",
      });
    }
  };

  const startTimer = async () => {
    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description",
        variant: "destructive",
      });
      return;
    }

    try {
      const entry = await backend.workspace.startTimeEntry({
        description,
        taskId: selectedTask || undefined,
        projectId: selectedProject || undefined,
      });
      setActiveEntry(entry);
      setEntries(prev => [entry, ...prev]);
      toast({
        title: "Success",
        description: "Timer started",
      });
    } catch (error) {
      console.error('Failed to start timer:', error);
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive",
      });
    }
  };

  const stopTimer = async () => {
    if (!activeEntry) return;

    try {
      const updated = await backend.workspace.stopTimeEntry({ id: activeEntry.id });
      setActiveEntry(null);
      setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
      setDescription('');
      toast({
        title: "Success",
        description: `Timer stopped. Duration: ${formatDuration(updated.duration || 0)}`,
      });
    } catch (error) {
      console.error('Failed to stop timer:', error);
      toast({
        title: "Error",
        description: "Failed to stop timer",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isOfflineMode) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold">Time Tracking</h2>
          <p className="text-muted-foreground">Track time spent on tasks and projects</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Time Tracking Unavailable</h3>
            <p className="text-muted-foreground">
              Time tracking requires online mode to function properly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold mb-2">Time Tracking</h2>
        <p className="text-muted-foreground">Track time spent on tasks and projects</p>
      </div>
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Timer Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeEntry ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-green-600">
                    {activeEntry.description}
                  </h3>
                  <p className="text-muted-foreground">
                    Started at {formatTime(activeEntry.startTime)}
                  </p>
                </div>
                <Button onClick={stopTimer} variant="destructive" size="lg" className="w-full">
                  <Square className="w-4 h-4 mr-2" />
                  Stop Timer
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  placeholder="What are you working on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={selectedProject || 'none'} onValueChange={(value) => setSelectedProject(value === 'none' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {/* Projects would be loaded here */}
                    </SelectContent>
                  </Select>
                  <Select value={selectedTask || 'none'} onValueChange={(value) => setSelectedTask(value === 'none' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No task</SelectItem>
                      {/* Tasks would be loaded here */}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={startTimer} size="lg" className="w-full" disabled={!description.trim()}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Timer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entries.slice(0, 10).map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{entry.description}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(entry.startTime)} - {entry.endTime ? formatTime(entry.endTime) : 'Running'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">
                      {entry.duration ? formatDuration(entry.duration) : 'Running'}
                    </span>
                    {entry.isRunning && (
                      <div className="text-green-600 text-sm">● Running</div>
                    )}
                  </div>
                </div>
              ))}
              {entries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4" />
                  <p>No time entries yet. Start your first timer!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
