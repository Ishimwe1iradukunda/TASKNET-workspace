import { api, StreamInOut } from "encore.dev/api";
import { db } from "./db";
import { db as workspaceDB } from "../workspace/db";
import { workspace } from "~encore/clients";
import type { User } from "../workspace/users/list";
import type { ClientChatMessage, ChatMessage } from "./api";
import { documentsBucket } from "../workspace/documents/storage";

interface Handshake {
  conversationId: string;
  userId: string; // In a real app, this would come from auth
}

// A map of active streams, keyed by conversation ID.
const streams = new Map<string, Set<StreamInOut<ClientChatMessage, ChatMessage>>>();

// chat is a bidirectional streaming API for real-time chat in conversations.
export const chat = api.streamInOut<Handshake, ClientChatMessage, ChatMessage>(
  { expose: true, path: "/messaging/stream" },
  async (handshake, stream) => {
    const { conversationId, userId } = handshake;

    // In a real app, you'd verify the user is a participant of the conversation.

    // Get or create the set of streams for this conversation
    if (!streams.has(conversationId)) {
      streams.set(conversationId, new Set());
    }
    const conversationStreams = streams.get(conversationId)!;
    conversationStreams.add(stream);

    try {
      // Listen for incoming messages
      for await (const msg of stream) {
        const now = new Date();
        let broadcastMsg: ChatMessage;

        const allUsers = (await workspace.listUsers()).users;
        const sender = allUsers.find(u => u.id === userId);
        if (!sender) continue; // Or handle error

        if (msg.type === 'file' && msg.documentId) {
          const doc = await workspaceDB.queryRow<{ id: string; name: string; path: string; file_type: string; size: number; }>`
            SELECT id, name, path, file_type, size FROM documents WHERE id = ${msg.documentId}
          `;
          if (!doc) continue;

          const fileInfo = { name: doc.name, path: doc.path, size: doc.size, type: doc.file_type };
          const messageId = crypto.randomUUID();
          await db.exec`
            INSERT INTO messages (id, conversation_id, sender_id, content, message_type, attachment, created_at)
            VALUES (${messageId}, ${conversationId}, ${userId}, '', 'file', ${JSON.stringify(fileInfo)}, ${now})
          `;

          const { url } = await documentsBucket.signedDownloadUrl(doc.path, { ttl: 3600 });
          broadcastMsg = {
            id: messageId,
            conversationId,
            sender,
            content: '',
            type: 'file',
            attachment: { ...fileInfo, url },
            createdAt: now,
          };
        } else {
          const messageId = crypto.randomUUID();
          await db.exec`
            INSERT INTO messages (id, conversation_id, sender_id, content, message_type, created_at)
            VALUES (${messageId}, ${conversationId}, ${userId}, ${msg.content || ''}, 'text', ${now})
          `;
          broadcastMsg = {
            id: messageId,
            conversationId,
            sender,
            content: msg.content || '',
            type: 'text',
            createdAt: now,
          };
        }

        // Update conversation's updated_at timestamp
        await db.exec`UPDATE conversations SET updated_at = ${now} WHERE id = ${conversationId}`;

        // Broadcast the message to all clients in the same conversation
        for (const s of conversationStreams) {
          try {
            await s.send(broadcastMsg);
          } catch {
            // Remove stream if it's closed
            conversationStreams.delete(s);
          }
        }
      }
    } finally {
      // Clean up when the client disconnects
      conversationStreams.delete(stream);
      if (conversationStreams.size === 0) {
        streams.delete(conversationId);
      }
    }
  }
);
