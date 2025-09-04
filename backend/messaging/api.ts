import type { User } from "../workspace/users/list";

// Represents a file attached to a chat message.
export interface FileAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

// ChatMessage is the message format sent from the server to clients.
export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: User;
  content: string;
  type: 'text' | 'file' | 'system';
  attachment?: FileAttachment;
  createdAt: Date;
}

// ClientChatMessage is the message format sent from clients to the server.
export interface ClientChatMessage {
  content?: string; // for text messages
  type: 'text' | 'file';
  documentId?: string; // for file messages
}

export interface ConversationSummary {
  id: string;
  name: string;
  isGroup: boolean;
  participants: User[];
  lastMessage?: {
    content: string;
    createdAt: Date;
  };
  updatedAt: Date;
}

export interface ConversationDetails extends ConversationSummary {
  messages: ChatMessage[];
}
