import { api, StreamInOut } from "encore.dev/api";
import { db } from "../workspace/db";

// ChatMessage is the message format for chat.
export interface ChatMessage {
  projectId: string;
  author: string;
  content: string;
  createdAt?: Date;
}

interface Handshake {
  projectId: string;
}

// A map of active streams, keyed by project ID.
const streams = new Map<string, Set<StreamInOut<ChatMessage, ChatMessage>>>();

// chat is a bidirectional streaming API for real-time chat in projects.
export const chat = api.streamInOut<Handshake, ChatMessage, ChatMessage>(
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
      const recentMessages = await db.queryAll<ChatMessage>`
        SELECT project_id, author, content, created_at
        FROM chat_messages
        WHERE project_id = ${projectId}
        ORDER BY created_at DESC
        LIMIT 50
      `;
      for (const msg of recentMessages.reverse()) {
        await stream.send({
          projectId: msg.projectId,
          author: msg.author,
          content: msg.content,
          createdAt: msg.createdAt,
        });
      }

      // Listen for incoming messages
      for await (const msg of stream) {
        const now = new Date();
        await db.exec`
          INSERT INTO chat_messages (id, project_id, author, content, created_at)
          VALUES (${crypto.randomUUID()}, ${projectId}, ${msg.author}, ${msg.content}, ${now})
        `;

        // Broadcast the message to all clients in the same project
        for (const s of projectStreams) {
          try {
            await s.send({ ...msg, createdAt: now });
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
