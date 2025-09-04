import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, MessageSquare, Paperclip, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { SecondarySidebar } from './SecondarySidebar';
import backend from '~backend/client';
import type { Project } from '~backend/workspace/projects/create';
import type { ChatMessage, ClientChatMessage } from '~backend/chat/chat';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatViewProps {
  isOfflineMode: boolean;
}

export function ChatView({ isOfflineMode }: ChatViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [stream, setStream] = useState<any>(null);
  const [username, setUsername] = useState(localStorage.getItem('chat_username') || '');
  const [isUsernameSet, setIsUsernameSet] = useState(!!localStorage.getItem('chat_username'));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOfflineMode) {
      loadProjects();
    }
  }, [isOfflineMode]);

  useEffect(() => {
    if (selectedProject && !isOfflineMode && isUsernameSet) {
      connectToChannel(selectedProject.id);
    }
    return () => {
      stream?.close();
    };
  }, [selectedProject, isOfflineMode, isUsernameSet]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadProjects = async () => {
    try {
      const response = await backend.workspace.listProjects({});
      setProjects(response.projects);
      if (response.projects.length > 0 && !selectedProject) {
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

  const handleSetUsername = () => {
    if (username.trim()) {
      localStorage.setItem('chat_username', username.trim());
      setIsUsernameSet(true);
      toast({ title: "Welcome!", description: `You've joined the chat as ${username.trim()}` });
    } else {
      toast({ title: "Error", description: "Please enter a username", variant: "destructive" });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !stream || !selectedProject || !isUsernameSet) return;
    try {
      const message: ClientChatMessage = {
        projectId: selectedProject.id,
        author: username,
        content: newMessage,
        type: 'text',
      };
      await stream.send(message);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !stream || !selectedProject) return;

    toast({ title: 'Uploading file...', description: file.name });

    try {
      // 1. Get a signed URL for upload
      const { uploadUrl, documentId } = await backend.workspace.getUploadUrl({
        name: file.name,
        type: file.type,
        size: file.size,
      });

      // 2. Upload the file
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed');
      }

      // 3. Send file message via WebSocket
      const message: ClientChatMessage = {
        projectId: selectedProject.id,
        author: username,
        type: 'file',
        documentId: documentId,
      };
      await stream.send(message);

      toast({ title: 'Success', description: 'File sent successfully' });
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast({ title: "Error", description: "Failed to upload and send file", variant: "destructive" });
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

  if (!isUsernameSet) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center w-full max-w-sm p-8 space-y-4 bg-card rounded-lg shadow-lg">
          <MessageSquare className="w-16 h-16 mx-auto text-primary mb-4" />
          <h3 className="text-2xl font-bold">Join the Chat</h3>
          <p className="text-muted-foreground">Please enter a username to start chatting.</p>
          <Input 
            placeholder="Your name" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleSetUsername()}
            className="h-12 text-lg"
          />
          <Button onClick={handleSetUsername} className="w-full h-12 text-lg">Join Chat</Button>
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
      <div className="flex-1 flex flex-col bg-background">
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
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {messages.map((msg, index) => {
                const isSender = msg.author === username;
                return (
                  <div key={index} className={`flex gap-3 ${isSender ? 'justify-end' : 'justify-start'}`}>
                    {!isSender && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{msg.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2">
                        {!isSender && <span className="font-semibold text-sm">{msg.author}</span>}
                        <span className="text-xs text-muted-foreground">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className={`p-3 rounded-lg max-w-lg ${isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {msg.type === 'file' && msg.attachment ? (
                          <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium truncate">{msg.attachment.name}</p>
                              <p className="text-sm opacity-80">{formatFileSize(msg.attachment.size)}</p>
                            </div>
                            <a href={msg.attachment.url} download={msg.attachment.name} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Download className="w-4 h-4" />
                              </Button>
                            </a>
                          </div>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <MarkdownRenderer content={msg.content} />
                          </div>
                        )}
                      </div>
                    </div>
                    {isSender && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{msg.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-border bg-muted/50">
              <div className="flex gap-2 items-center">
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="w-5 h-5" />
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <Input
                  placeholder="Type a message... (Markdown supported)"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
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
