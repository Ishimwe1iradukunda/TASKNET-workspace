import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { SecondarySidebar } from './SecondarySidebar';
import backend from '~backend/client';
import type { Project } from '~backend/workspace/projects/create';
import type { ChatMessage } from '~backend/chat/chat';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChatViewProps {
  isOfflineMode: boolean;
}

export function ChatView({ isOfflineMode }: ChatViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [stream, setStream] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOfflineMode) {
      loadProjects();
    }
  }, [isOfflineMode]);

  useEffect(() => {
    if (selectedProject && !isOfflineMode) {
      connectToChannel(selectedProject.id);
    }
    return () => {
      stream?.close();
    };
  }, [selectedProject, isOfflineMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadProjects = async () => {
    try {
      const response = await backend.workspace.listProjects({});
      setProjects(response.projects);
      if (response.projects.length > 0) {
        setSelectedProject(response.projects[0]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({ title: "Error", description: "Failed to load projects", variant: "destructive" });
    }
  };

  const connectToChannel = async (projectId: string) => {
    if (stream) {
      stream.close();
    }
    setMessages([]);
    try {
      const newStream = await backend.chat.chat({ projectId });
      setStream(newStream);

      for await (const msg of newStream) {
        setMessages(prev => [...prev, msg]);
      }
    } catch (error) {
      console.error('Failed to connect to chat:', error);
      toast({ title: "Error", description: "Failed to connect to chat channel", variant: "destructive" });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !stream || !selectedProject) return;
    try {
      await stream.send({
        projectId: selectedProject.id,
        author: 'You', // In a real app, this would be the authenticated user's name
        content: newMessage,
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  };

  if (isOfflineMode) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Chat Unavailable</h3>
          <p className="text-muted-foreground">Chat requires an active internet connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <SecondarySidebar title="Projects">
        {projects.map(project => (
          <div
            key={project.id}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50 ${
              selectedProject?.id === project.id ? 'bg-muted' : ''
            }`}
            onClick={() => setSelectedProject(project)}
          >
            <Hash className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm flex-1 truncate">{project.name}</span>
          </div>
        ))}
      </SecondarySidebar>
      <div className="flex-1 flex flex-col">
        <div className="md:hidden p-4 border-b">
          <Select value={selectedProject?.id || ''} onValueChange={(id) => setSelectedProject(projects.find(p => p.id === id) || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {selectedProject ? (
          <>
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-bold">{selectedProject.name}</h2>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold">{msg.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <p>{msg.content}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a project to chat</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
