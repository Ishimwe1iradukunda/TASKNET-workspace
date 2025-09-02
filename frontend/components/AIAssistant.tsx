import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Copy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import backend from '~backend/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  isOfflineMode: boolean;
}

export function AIAssistant({ isOfflineMode }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (isOfflineMode) {
      toast({
        title: "Offline Mode",
        description: "AI Assistant requires an internet connection",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await backend.workspace.chat({
        message: userMessage.content,
        context: messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n'),
      });

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message to AI assistant",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  const clearChat = () => {
    setMessages([]);
  };

  const suggestions = [
    "Help me organize my project tasks",
    "Write a summary for my meeting notes",
    "Create a project timeline template",
    "Suggest tags for organizing my notes",
    "Help me write a professional email",
    "Generate ideas for my wiki structure",
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">AI Assistant</h2>
            <p className="text-muted-foreground">Build, write, automate with AI</p>
          </div>
          {messages.length > 0 && (
            <Button variant="outline" onClick={clearChat}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear Chat
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-2xl">
              <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Welcome to AI Assistant</h3>
              <p className="text-muted-foreground mb-6">
                I can help you with writing, organizing, and automating your work. Try asking me something!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="text-left justify-start h-auto p-3"
                    onClick={() => setInput(suggestion)}
                    disabled={isOfflineMode}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
              
              {isOfflineMode && (
                <p className="text-sm text-muted-foreground mt-4">
                  AI Assistant requires an internet connection. Switch to online mode to continue.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message) => (
              <Card key={message.id} className={message.role === 'user' ? 'ml-12' : 'mr-12'}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {message.role === 'user' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                    <CardTitle className="text-sm">
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === 'assistant' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => copyToClipboard(message.content)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {isLoading && (
              <Card className="mr-12">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div className="p-6 border-t border-border">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            placeholder={isOfflineMode ? "AI Assistant requires internet connection" : "Ask me anything..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoading || isOfflineMode}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading || isOfflineMode}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
