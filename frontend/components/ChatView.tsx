import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Paperclip, Download, FileText, Plus, Users, UserPlus, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { SecondarySidebar } from './SecondarySidebar';
import backend from '~backend/client';
import type { ConversationSummary, ConversationDetails, ChatMessage } from '~backend/messaging/api';
import type { User } from '~backend/workspace/users/list';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

interface ChatViewProps {
  isOfflineMode: boolean;
}

const CURRENT_USER_ID = 'user-1'; // This would come from an auth context in a real app

export function ChatView({ isOfflineMode }: ChatViewProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [stream, setStream] = useState<any>(null);
  const [isNewConvoOpen, setIsNewConvoOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOfflineMode) {
      loadConversations();
    }
  }, [isOfflineMode]);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(selectedConversation.messages);
      connectToChannel(selectedConversation.id);
    }
    return () => {
      stream?.close();
    };
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await backend.messaging.listConversations();
      setConversations(response.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast({ title: "Error", description: "Failed to load conversations", variant: "destructive" });
    }
  };

  const selectConversation = async (convo: ConversationSummary) => {
    try {
      const details = await backend.messaging.getConversation({ conversationId: convo.id });
      setSelectedConversation(details);
    } catch (error) {
      console.error('Failed to load conversation details:', error);
      toast({ title: "Error", description: "Failed to load conversation details", variant: "destructive" });
    }
  };

  const connectToChannel = async (conversationId: string) => {
    if (stream) stream.close();
    try {
      const newStream = await backend.messaging.chat({ conversationId, userId: CURRENT_USER_ID });
      setStream(newStream);

      for await (const msg of newStream) {
        setMessages(prev => [...prev, msg]);
        // Update last message in sidebar
        setConversations(prev => prev.map(c => c.id === msg.conversationId ? { ...c, lastMessage: { content: msg.content, createdAt: msg.createdAt } } : c));
      }
    } catch (error) {
      console.error('Failed to connect to chat:', error);
      toast({ title: "Error", description: "Failed to connect to chat channel", variant: "destructive" });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !stream || !selectedConversation) return;
    try {
      await stream.send({
        content: newMessage,
        type: 'text',
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  };

  const handleCreateConversation = async (userIds: string[], name?: string, invitedEmails?: string[]) => {
    try {
      const newConvo = await backend.messaging.createConversation({ userIds, name, invitedEmails });
      setIsNewConvoOpen(false);
      await loadConversations();
      await selectConversation(newConvo);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast({ title: "Error", description: "Failed to create conversation", variant: "destructive" });
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

  return (
    <div className="flex h-full">
      <SecondarySidebar title="Inbox">
        <div className="p-2">
          <Button className="w-full" onClick={() => setIsNewConvoOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Message
          </Button>
        </div>
        {conversations.map(convo => (
          <div
            key={convo.id}
            className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted/50 ${
              selectedConversation?.id === convo.id ? 'bg-muted' : ''
            }`}
            onClick={() => selectConversation(convo)}
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={convo.isGroup ? undefined : convo.participants.find(p => p.id !== CURRENT_USER_ID)?.avatarUrl} />
              <AvatarFallback>
                {convo.isGroup ? <Users className="w-5 h-5" /> : convo.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{convo.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {convo.lastMessage?.content || 'No messages yet'}
              </p>
            </div>
          </div>
        ))}
      </SecondarySidebar>
      <div className="flex-1 flex flex-col bg-background">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedConversation.name}</h2>
              <Button variant="outline" size="sm"><UserPlus className="w-4 h-4 mr-2" /> Invite</Button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {messages.map((msg) => {
                const isSender = msg.sender.id === CURRENT_USER_ID;
                return (
                  <div key={msg.id} className={`flex gap-3 ${isSender ? 'justify-end' : 'justify-start'}`}>
                    {!isSender && (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={msg.sender.avatarUrl} />
                        <AvatarFallback>{msg.sender.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2">
                        {!isSender && <span className="font-semibold text-sm">{msg.sender.name}</span>}
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        <AvatarImage src={msg.sender.avatarUrl} />
                        <AvatarFallback>{msg.sender.name.substring(0, 2).toUpperCase()}</AvatarFallback>
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
                <input type="file" ref={fileInputRef} className="hidden" />
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
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a conversation from the inbox to start chatting.</p>
            </div>
          </div>
        )}
      </div>
      <NewConversationDialog
        open={isNewConvoOpen}
        onOpenChange={setIsNewConvoOpen}
        onCreate={handleCreateConversation}
      />
    </div>
  );
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (userIds: string[], name?: string, invitedEmails?: string[]) => void;
}

function NewConversationDialog({ open, onOpenChange, onCreate }: NewConversationDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    if (open) {
      backend.workspace.listUsers().then(res => {
        setUsers(res.users.filter(u => u.id !== CURRENT_USER_ID));
      });
    } else {
      setSelectedUsers([]);
      setGroupName('');
      setInvitedEmails([]);
      setEmailInput('');
    }
  }, [open]);

  const handleSelectUser = (user: User) => {
    setSelectedUsers(prev => 
      prev.some(u => u.id === user.id) 
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleEmailInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',' || e.key === ' ') && emailInput.trim()) {
      e.preventDefault();
      const email = emailInput.trim();
      if (email && !invitedEmails.includes(email) && email.includes('@')) {
        setInvitedEmails([...invitedEmails, email]);
        setEmailInput('');
      }
    }
  };

  const removeInvitedEmail = (emailToRemove: string) => {
    setInvitedEmails(invitedEmails.filter(email => email !== emailToRemove));
  };

  const handleCreate = () => {
    if (selectedUsers.length === 0 && invitedEmails.length === 0) return;
    onCreate(selectedUsers.map(u => u.id), groupName.trim() || undefined, invitedEmails);
  };

  const filteredUsers = users.filter(user => 
    !selectedUsers.some(su => su.id === user.id) &&
    (user.name.toLowerCase().includes(emailInput.toLowerCase()) || user.email.toLowerCase().includes(emailInput.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>Select people to start a chat, or invite by email.</DialogDescription>
        </DialogHeader>
        <Command className="rounded-lg">
          <div className="p-2 border-b">
            <div className="flex flex-wrap gap-1 mb-2 min-h-[24px]">
              {selectedUsers.map(user => (
                <Badge key={user.id} variant="secondary">
                  {user.name}
                  <button onClick={() => handleSelectUser(user)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <XCircle className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {invitedEmails.map(email => (
                <Badge key={email} variant="outline">
                  {email}
                  <button onClick={() => removeInvitedEmail(email)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <XCircle className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <CommandInput 
              placeholder="Search or invite by email..." 
              value={emailInput}
              onValueChange={setEmailInput}
              onKeyDown={handleEmailInputKeyDown}
            />
          </div>
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              {filteredUsers.map(user => (
                <CommandItem
                  key={user.id}
                  onSelect={() => {
                    handleSelectUser(user);
                    setEmailInput('');
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="p-6 pt-0 space-y-4">
          {(selectedUsers.length + invitedEmails.length) > 1 && (
            <Input 
              placeholder="Group name (optional)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          )}
          <Button onClick={handleCreate} disabled={selectedUsers.length === 0 && invitedEmails.length === 0} className="w-full">
            Start Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
