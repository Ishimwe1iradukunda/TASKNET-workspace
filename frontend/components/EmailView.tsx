import React, { useState, useEffect } from 'react';
import { Inbox, Trash2, Archive, MailOpen, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageManager } from '../utils/localStorage';
import backend from '~backend/client';
import type { Email } from '~backend/workspace/emails/list';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmailViewProps {
  isOfflineMode: boolean;
}

export function EmailView({ isOfflineMode }: EmailViewProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEmails();
  }, [isOfflineMode]);

  const loadEmails = async () => {
    try {
      let loadedEmails: Email[];
      if (isOfflineMode) {
        loadedEmails = LocalStorageManager.getEmails();
      } else {
        const response = await backend.workspace.listEmails();
        loadedEmails = response.emails;
      }
      setEmails(loadedEmails);
      if (loadedEmails.length > 0 && !selectedEmail) {
        setSelectedEmail(loadedEmails[0]);
      } else if (loadedEmails.length === 0) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Failed to load emails:', error);
      toast({
        title: "Error",
        description: "Failed to load emails",
        variant: "destructive",
      });
    }
  };

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      try {
        if (isOfflineMode) {
          const updated = LocalStorageManager.updateEmail(email.id, { isRead: true });
          setEmails(prev => prev.map(e => e.id === email.id ? updated : e));
        } else {
          await backend.workspace.updateEmail({ id: email.id, isRead: true });
          setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));
        }
      } catch (error) {
        console.error('Failed to mark email as read:', error);
      }
    }
  };

  const handleDeleteEmail = async (id: string) => {
    try {
      if (isOfflineMode) {
        LocalStorageManager.deleteEmail(id);
      } else {
        await backend.workspace.deleteEmail({ id });
      }
      setEmails(prev => {
        const newEmails = prev.filter(e => e.id !== id);
        if (selectedEmail?.id === id) {
          setSelectedEmail(newEmails.length > 0 ? newEmails[0] : null);
        }
        return newEmails;
      });
      toast({
        title: "Success",
        description: "Email deleted",
      });
    } catch (error) {
      console.error('Failed to delete email:', error);
      toast({
        title: "Error",
        description: "Failed to delete email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-full md:w-96 border-r border-border flex-col h-full hidden md:flex">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold">Inbox</h2>
        </div>
        <div className="flex-1 overflow-auto">
          {emails.map(email => (
            <div
              key={email.id}
              className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 ${
                selectedEmail?.id === email.id ? 'bg-muted' : ''
              }`}
              onClick={() => handleSelectEmail(email)}
            >
              <div className="flex items-center justify-between">
                <p className={`font-semibold truncate ${!email.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {email.sender}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(email.receivedAt).toLocaleDateString()}
                </p>
              </div>
              <p className={`truncate ${!email.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                {email.subject}
              </p>
            </div>
          ))}
          {emails.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Inbox className="w-12 h-12 mx-auto mb-4" />
              <p>Your inbox is empty.</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="md:hidden p-4 border-b">
          <Select value={selectedEmail?.id || ''} onValueChange={(id) => handleSelectEmail(emails.find(e => e.id === id)!)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an email..." />
            </SelectTrigger>
            <SelectContent>
              {emails.map(email => <SelectItem key={email.id} value={email.id}>{email.subject}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {selectedEmail ? (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold truncate">{selectedEmail.subject}</h3>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteEmail(selectedEmail.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              <p><strong>From:</strong> {selectedEmail.sender}</p>
              <p><strong>To:</strong> {selectedEmail.recipient}</p>
              <p className="text-sm text-muted-foreground">
                Received: {new Date(selectedEmail.receivedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex-1 overflow-auto p-6 border-t border-border">
              <div className="prose max-w-none whitespace-pre-wrap">
                {selectedEmail.body}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-center text-muted-foreground">
            <div>
              <Mail className="w-16 h-16 mx-auto mb-4" />
              <p>Select an email to read</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
