import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageManager } from '../utils/localStorage';
import backend from '~backend/client';
import type { Task } from '~backend/workspace/tasks/create';

interface PlannerViewProps {
  isOfflineMode: boolean;
}

export function PlannerView({ isOfflineMode }: PlannerViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, [isOfflineMode, currentDate]);

  const loadTasks = async () => {
    try {
      if (isOfflineMode) {
        setTasks(LocalStorageManager.getTasks());
      } else {
        const response = await backend.workspace.listTasks({});
        setTasks(response.tasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast({ title: "Error", description: "Failed to load tasks", variant: "destructive" });
    }
  };

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const changeWeek = (amount: number) => {
    setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + amount * 7)));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h2 className="text-2xl font-bold">Weekly Planner</h2>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => changeWeek(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-medium w-48 text-center">
            {startOfWeek.toLocaleDateString()} - {weekDays[6].toLocaleDateString()}
          </span>
          <Button variant="outline" size="sm" onClick={() => changeWeek(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {/* Desktop Grid View */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map(day => {
            const dayTasks = tasks.filter(
              task => task.dueDate && new Date(task.dueDate).toDateString() === day.toDateString()
            );
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div key={day.toISOString()} className="bg-muted/30 rounded-lg p-4">
                <h3 className={`font-semibold text-center mb-4 ${isToday ? 'text-primary' : ''}`}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  <span className="block text-2xl">{day.getDate()}</span>
                </h3>
                <div className="space-y-2">
                  {dayTasks.map(task => (
                    <Card key={task.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-2">
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${getPriorityColor(task.priority)}`} />
                          <p className="text-sm font-medium line-clamp-2">{task.title}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {dayTasks.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground pt-4">No tasks due</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile List View */}
        <div className="md:hidden space-y-4">
          {weekDays.map(day => {
            const dayTasks = tasks.filter(
              task => task.dueDate && new Date(task.dueDate).toDateString() === day.toDateString()
            );
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div key={day.toISOString()}>
                <h3 className={`font-semibold mb-2 ${isToday ? 'text-primary' : ''}`}>
                  {day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                {dayTasks.length > 0 ? dayTasks.map(task => (
                  <Card key={task.id} className="mb-2">
                    <CardContent className="p-3 flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${getPriorityColor(task.priority)}`} />
                      <p className="text-sm font-medium">{task.title}</p>
                    </CardContent>
                  </Card>
                )) : (
                  <p className="text-sm text-muted-foreground">No tasks due.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
