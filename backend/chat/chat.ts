import { api, StreamInOut } from "encore.dev/api";
import { db } from "../workspace/db";
import { documentsBucket } from "../workspace/documents/storage";

// FileAttachment represents a file attached to a chat message.
export interface FileAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

// ChatMessage is the message format sent from the server to clients.
export interface ChatMessage {
  projectId: string;
  author: string;
  content: string;
  type: 'text' | 'file';
  attachment?: FileAttachment;
  createdAt?: Date;
}

// ClientChatMessage is the message format sent from clients to the server.
export interface ClientChatMessage {
  projectId: string;
  author: string;
  content?: string; // for text messages
  type: 'text' | 'file';
  documentId?: string; // for file messages
}

interface Handshake {
  projectId: string;
}

// A map of active streams, keyed by project ID.
const streams = new Map<string, Set<StreamInOut<ClientChatMessage, ChatMessage>>>();

// chat is a bidirectional streaming API for real-time chat in projects.
export const chat = api.streamInOut<Handshake, ClientChatMessage, ChatMessage>(
  { expose: true, path: "/chat" },
  async (handshake, stream) => {
    const { projectId } = handshake;

    // Get or create the set of streams for this project
    if (!streams.has(projectId)) {
      streams.set(projectId, new Set());
    }
    const projectStreams = streams.get(projectId)!;
    projectStreams.add(stream);

    try {
      // Send recent messages on connect
      const recentMessages = await db.queryAll<{
        project_id: string;
        author: string;
        content: string;
        created_at: Date;
        message_type: 'text' | 'file';
      }>`
        SELECT project_id, author, content, created_at, message_type
        FROM chat_messages
        WHERE project_id = ${projectId}
        ORDER BY created_at DESC
        LIMIT 50
      `;

      for (const msg of recentMessages.reverse()) {
        let messageToSend: ChatMessage;
        if (msg.message_type === 'file') {
          const fileInfo = JSON.parse(msg.content);
          const { url } = await documentsBucket.signedDownloadUrl(fileInfo.path, { ttl: 3600 });
          messageToSend = {
            projectId: msg.project_id,
            author: msg.author,
            content: '',
            type: 'file',
            attachment: {
              name: fileInfo.name,
              size: fileInfo.size,
              type: fileInfo.type,
              url: url,
            },
            createdAt: msg.created_at,
          };
        } else {
          messageToSend = {
            projectId: msg.project_id,
            author: msg.author,
            content: msg.content,
            type: 'text',
            createdAt: msg.created_at,
          };
        }
        await stream.send(messageToSend);
      }

      // Listen for incoming messages
      for await (const msg of stream) {
        const now = new Date();
        let broadcastMsg: ChatMessage;

        if (msg.type === 'file' && msg.documentId) {
          const doc = await db.queryRow<{ id: string; name: string; path: string; file_type: string; size: number; }>`
            SELECT id, name, path, file_type, size FROM documents WHERE id = ${msg.documentId}
          `;
          if (!doc) continue; // or send an error message

          const fileInfo = { name: doc.name, path: doc.path, size: doc.size, type: doc.file_type };
          await db.exec`
            INSERT INTO chat_messages (id, project_id, author, content, message_type, created_at)
            VALUES (${crypto.randomUUID()}, ${projectId}, ${msg.author}, ${JSON.stringify(fileInfo)}, 'file', ${now})
          `;

          const { url } = await documentsBucket.signedDownloadUrl(doc.path, { ttl: 3600 });
          broadcastMsg = {
            projectId,
            author: msg.author,
            content: '',
            type: 'file',
            attachment: { ...fileInfo, url },
            createdAt: now,
          };
        } else {
          await db.exec`
            INSERT INTO chat_messages (id, project_id, author, content, message_type, created_at)
            VALUES (${crypto.randomUUID()}, ${projectId}, ${msg.author}, ${msg.content || ''}, 'text', ${now})
          `;
          broadcastMsg = {
            projectId,
            author: msg.author,
            content: msg.content || '',
            type: 'text',
            createdAt: now,
          };
        }

        // Broadcast the message to all clients in the same project
        for (const s of projectStreams) {
          try {
            await s.send(broadcastMsg);
          } catch {
            // Remove stream if it's closed
            projectStreams.delete(s);
          }
        }
      }
    } finally {
      // Clean up when the client disconnects
      projectStreams.delete(stream);
      if (projectStreams.size === 0) {
        streams.delete(projectId);
      }
    }
  }
);
