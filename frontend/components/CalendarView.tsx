import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageManager } from '../utils/localStorage';
import backend from '~backend/client';
import type { Task } from '~backend/workspace/tasks/create';
import type { Project } from '~backend/workspace/projects/create';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'task' | 'project-start' | 'project-end';
  color: string;
}

interface CalendarViewProps {
  isOfflineMode: boolean;
}

export function CalendarView({ isOfflineMode }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, [isOfflineMode, currentDate]);

  const loadEvents = async () => {
    try {
      let tasks: Task[] = [];
      let projects: Project[] = [];

      if (isOfflineMode) {
        tasks = LocalStorageManager.getTasks();
        projects = LocalStorageManager.getProjects();
      } else {
        const [taskResponse, projectResponse] = await Promise.all([
          backend.workspace.listTasks({}),
          backend.workspace.listProjects({}),
        ]);
        tasks = taskResponse.tasks;
        projects = projectResponse.projects;
      }

      const taskEvents: CalendarEvent[] = tasks
        .filter(task => task.dueDate)
        .map(task => ({
          id: `task-${task.id}`,
          title: task.title,
          date: new Date(task.dueDate!),
          type: 'task',
          color: 'bg-blue-500',
        }));

      const projectStartEvents: CalendarEvent[] = projects
        .filter(project => project.startDate)
        .map(project => ({
          id: `project-start-${project.id}`,
          title: `${project.name} (Start)`,
          date: new Date(project.startDate!),
          type: 'project-start',
          color: 'bg-green-500',
        }));

      const projectEndEvents: CalendarEvent[] = projects
        .filter(project => project.endDate)
        .map(project => ({
          id: `project-end-${project.id}`,
          title: `${project.name} (End)`,
          date: new Date(project.endDate!),
          type: 'project-end',
          color: 'bg-red-500',
        }));

      setEvents([...taskEvents, ...projectStartEvents, ...projectEndEvents]);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar events",
        variant: "destructive",
      });
    }
  };

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days = [];
  let day = new Date(startDate);
  while (day <= endDate) {
    days.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const changeMonth = (amount: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + amount, 1));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h2 className="text-2xl font-bold">Calendar</h2>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-medium w-40 text-center">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-7 gap-px bg-border border-l border-t">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center font-medium bg-muted/50">
              {day}
            </div>
          ))}
          {days.map(day => {
            const dayEvents = events.filter(
              e => e.date.toDateString() === day.toDateString()
            );
            const isToday = day.toDateString() === new Date().toDateString();
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

            return (
              <div
                key={day.toISOString()}
                className={`p-2 bg-background border-r border-b min-h-[120px] ${
                  !isCurrentMonth ? 'bg-muted/30' : ''
                }`}
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-full text-sm ${
                  isToday ? 'bg-primary text-primary-foreground' : ''
                }`}>
                  {day.getDate()}
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.map(event => (
                    <div key={event.id} className={`p-1 rounded text-xs text-white truncate ${event.color}`}>
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
