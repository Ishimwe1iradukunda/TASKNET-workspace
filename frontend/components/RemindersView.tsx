import React, { useState, useEffect } from 'react';
import { Plus, Bell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';
import type { Reminder } from '~backend/reminders/create';

interface RemindersViewProps {
  isOfflineMode: boolean;
}

export function RemindersView({ isOfflineMode }: RemindersViewProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    remindAt: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!isOfflineMode) {
      loadReminders();
      const interval = setInterval(checkNotifications, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isOfflineMode]);

  const loadReminders = async () => {
    try {
      const response = await backend.reminders.listReminders();
      setReminders(response.reminders);
    } catch (error) {
      console.error('Failed to load reminders:', error);
      toast({ title: "Error", description: "Failed to load reminders", variant: "destructive" });
    }
  };

  const checkNotifications = async () => {
    const now = new Date();
    const dueReminders = reminders.filter(r => !r.isTriggered && new Date(r.remindAt) <= now);
    for (const reminder of dueReminders) {
      if (Notification.permission === "granted") {
        new Notification(reminder.title, {
          body: reminder.description || `Reminder set for ${new Date(reminder.remindAt).toLocaleTimeString()}`,
        });
      }
      // This should ideally be updated based on a backend event, but we'll update it optimistically
      setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, isTriggered: true } : r));
    }
  };

  const createReminder = async () => {
    if (!newReminder.title.trim() || !newReminder.remindAt) return;
    try {
      const reminder = await backend.reminders.createReminder({
        title: newReminder.title,
        description: newReminder.description || undefined,
        remindAt: new Date(newReminder.remindAt),
      });
      setReminders(prev => [...prev, reminder].sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()));
      setNewReminder({ title: '', description: '', remindAt: '' });
      setIsCreateDialogOpen(false);
      toast({ title: "Success", description: "Reminder created successfully" });
    } catch (error) {
      console.error('Failed to create reminder:', error);
      toast({ title: "Error", description: "Failed to create reminder", variant: "destructive" });
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await backend.reminders.deleteReminder({ id });
      setReminders(prev => prev.filter(r => r.id !== id));
      toast({ title: "Success", description: "Reminder deleted" });
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      toast({ title: "Error", description: "Failed to delete reminder", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  if (isOfflineMode) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Reminders Unavailable</h3>
          <p className="text-muted-foreground">Reminders require an active internet connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reminders & Alarms</h2>
          <p className="text-muted-foreground">Set reminders for important events</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Reminder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Reminder</DialogTitle>
              <DialogDescription>
                Set a reminder for an important event or task.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Title" value={newReminder.title} onChange={(e) => setNewReminder(p => ({ ...p, title: e.target.value }))} />
              <Textarea placeholder="Description (optional)" value={newReminder.description} onChange={(e) => setNewReminder(p => ({ ...p, description: e.target.value }))} />
              <Input type="datetime-local" value={newReminder.remindAt} onChange={(e) => setNewReminder(p => ({ ...p, remindAt: e.target.value }))} />
              <Button onClick={createReminder}>Set Reminder</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reminders.map(reminder => (
            <Card key={reminder.id} className={reminder.isTriggered ? 'opacity-50' : ''}>
              <CardHeader>
                <CardTitle>{reminder.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {reminder.description && <p className="text-muted-foreground mb-2">{reminder.description}</p>}
                <p>Remind at: {new Date(reminder.remindAt).toLocaleString()}</p>
                <Button variant="ghost" size="sm" onClick={() => deleteReminder(reminder.id)} className="mt-2">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        {reminders.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No reminders found</h3>
          </div>
        )}
      </div>
    </div>
  );
}
