import React, { useState } from 'react';
import { Plus, Zap, CheckSquare, FileText, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageManager } from '../utils/localStorage';
import backend from '~backend/client';

interface QuickCaptureProps {
  isOfflineMode: boolean;
  onItemCreated?: () => void;
}

export function QuickCapture({ isOfflineMode, onItemCreated }: QuickCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [captureType, setCaptureType] = useState<'task' | 'note' | 'idea'>('task');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tags, setTags] = useState('');
  const { toast } = useToast();

  const captureTypes = [
    { id: 'task', label: 'Quick Task', icon: CheckSquare, description: 'Add a task to your list' },
    { id: 'note', label: 'Quick Note', icon: FileText, description: 'Capture thoughts or information' },
    { id: 'idea', label: 'Idea/Goal', icon: Target, description: 'Store ideas for later development' },
  ];

  const handleCapture = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsedTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);

      if (captureType === 'task') {
        if (isOfflineMode) {
          LocalStorageManager.createTask({
            title,
            description: content || undefined,
            tags: parsedTags,
            priority,
            status: 'todo',
          });
        } else {
          await backend.workspace.createTask({
            title,
            description: content || undefined,
            tags: parsedTags,
            priority,
          });
        }
      } else if (captureType === 'note') {
        if (isOfflineMode) {
          LocalStorageManager.createNote({
            title,
            content: content || '',
            tags: parsedTags,
          });
        } else {
          await backend.workspace.createNote({
            title,
            content: content || '',
            tags: parsedTags,
          });
        }
      } else if (captureType === 'idea') {
        // Store ideas as notes with special tags
        const ideaTags = ['idea', ...parsedTags];
        if (isOfflineMode) {
          LocalStorageManager.createNote({
            title: `💡 ${title}`,
            content: content || '',
            tags: ideaTags,
          });
        } else {
          await backend.workspace.createNote({
            title: `💡 ${title}`,
            content: content || '',
            tags: ideaTags,
          });
        }
      }

      // Reset form
      setTitle('');
      setContent('');
      setTags('');
      setPriority('medium');
      setIsOpen(false);

      toast({
        title: "Success",
        description: `${captureType === 'task' ? 'Task' : captureType === 'note' ? 'Note' : 'Idea'} captured successfully`,
      });

      if (onItemCreated) {
        onItemCreated();
      }
    } catch (error) {
      console.error('Failed to capture item:', error);
      toast({
        title: "Error",
        description: `Failed to capture ${captureType}`,
        variant: "destructive",
      });
    }
  };

  const selectedType = captureTypes.find(type => type.id === captureType);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50">
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Capture
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Capture Type Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">What would you like to capture?</label>
              <div className="grid grid-cols-1 gap-2">
                {captureTypes.map((type) => (
                  <Button
                    key={type.id}
                    variant={captureType === type.id ? 'default' : 'outline'}
                    className="justify-start h-auto p-3"
                    onClick={() => setCaptureType(type.id as any)}
                  >
                    <type.icon className="w-4 h-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                placeholder={`Enter ${captureType} title...`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            {/* Content Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {captureType === 'task' ? 'Description' : 'Content'} (optional)
              </label>
              <Textarea
                placeholder={`Add ${captureType === 'task' ? 'description' : 'content'}...`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
              />
            </div>

            {/* Task-specific Priority */}
            {captureType === 'task' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tags Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tags (optional)</label>
              <Input
                placeholder="Enter tags separated by commas..."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleCapture} disabled={!title.trim()} className="flex-1">
                {selectedType && <selectedType.icon className="w-4 h-4 mr-2" />}
                Capture {selectedType?.label}
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
