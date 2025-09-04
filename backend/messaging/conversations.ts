import { api, APIError } from "encore.dev/api";
import { db } from "./db";
import { workspace } from "~encore/clients";
import type { User } from "../workspace/users/list";
import type { ConversationSummary, ConversationDetails, ChatMessage } from "./api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const workspaceDB = SQLDatabase.named("workspace");

// === List Conversations (Inbox) ===

export interface ListConversationsResponse {
  conversations: ConversationSummary[];
}

// listConversations retrieves all conversations for the current user.
export const listConversations = api<void, ListConversationsResponse>({
  expose: true,
  method: "GET",
  path: "/conversations",
}, async () => {
  const currentUserId = 'user-1'; // In a real app, this would come from auth

  const conversationRows = await db.queryAll<{
    id: string;
    name: string;
    is_group: boolean;
    updated_at: Date;
    last_message_content: string | null;
    last_message_created_at: Date | null;
  }>`
    SELECT
      c.id, c.name, c.is_group, c.updated_at,
      lm.content as last_message_content,
      lm.created_at as last_message_created_at
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    LEFT JOIN LATERAL (
      SELECT content, created_at FROM messages
      WHERE conversation_id = c.id
      ORDER BY created_at DESC
      LIMIT 1
    ) lm ON true
    WHERE cp.user_id = ${currentUserId}
    ORDER BY c.updated_at DESC
  `;

  if (conversationRows.length === 0) {
    return { conversations: [] };
  }

  const conversationIds = conversationRows.map(c => c.id);
  const participantRows = await db.queryAll<{ conversation_id: string; user_id: string }>`
    SELECT conversation_id, user_id FROM conversation_participants
    WHERE conversation_id IN (${conversationIds})
  `;

  const allUsers = (await workspace.listUsers()).users;
  const usersById = new Map(allUsers.map(u => [u.id, u]));

  const participantsByConversationId = new Map<string, User[]>();
  for (const p of participantRows) {
    const user = usersById.get(p.user_id);
    if (user) {
      if (!participantsByConversationId.has(p.conversation_id)) {
        participantsByConversationId.set(p.conversation_id, []);
      }
      participantsByConversationId.get(p.conversation_id)!.push(user);
    }
  }

  const conversations: ConversationSummary[] = conversationRows.map(c => {
    const participants = participantsByConversationId.get(c.id) || [];
    let name = c.name;
    if (!c.is_group) {
      const otherParticipant = participants.find(p => p.id !== currentUserId);
      name = otherParticipant?.name || 'Conversation';
    }

    return {
      id: c.id,
      name,
      isGroup: c.is_group,
      participants,
      lastMessage: c.last_message_content ? {
        content: c.last_message_content,
        createdAt: c.last_message_created_at!,
      } : undefined,
      updatedAt: c.updated_at,
    };
  });

  return { conversations };
});


// === Create Conversation ===

export interface CreateConversationRequest {
  userIds: string[];
  invitedEmails?: string[];
  name?: string;
}

// createConversation starts a new conversation with one or more users.
export const createConversation = api<CreateConversationRequest, ConversationSummary>({
  expose: true,
  method: "POST",
  path: "/conversations",
}, async ({ userIds, invitedEmails, name }) => {
  const currentUserId = 'user-1';
  const allParticipantIds = [...new Set([currentUserId, ...userIds])];

  if (invitedEmails && invitedEmails.length > 0) {
    for (const email of invitedEmails) {
      if (!email.includes('@')) continue; // basic email validation
      let user = await workspaceDB.queryRow<{ id: string }>`
        SELECT id FROM users WHERE email = ${email}
      `;
      if (!user) {
        // Create a new user
        const newUserId = crypto.randomUUID();
        const newUserName = email.split('@')[0]; // Simple name generation
        await workspaceDB.exec`
          INSERT INTO users (id, name, email, avatar_url)
          VALUES (${newUserId}, ${newUserName}, ${email}, ${`https://i.pravatar.cc/150?u=${newUserId}`})
        `;
        user = { id: newUserId };
      }
      if (!allParticipantIds.includes(user.id)) {
        allParticipantIds.push(user.id);
      }
    }
  }

  if (allParticipantIds.length < 2) {
    throw APIError.invalidArgument("A conversation must have at least two participants.");
  }

  const isGroup = allParticipantIds.length > 2 || !!name;

  // For DMs, check if a conversation already exists
  if (!isGroup) {
    const existing = await db.queryRow<{ conversation_id: string }>`
      SELECT conversation_id FROM conversation_participants cp1
      JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
      JOIN conversations c ON cp1.conversation_id = c.id
      WHERE cp1.user_id = ${allParticipantIds[0]}
        AND cp2.user_id = ${allParticipantIds[1]}
        AND c.is_group = FALSE
    `;
    if (existing) {
      const conv = await getConversationById(existing.conversation_id, currentUserId);
      if (!conv) throw APIError.notFound("Conversation not found");
      return conv;
    }
  }

  const conversationId = crypto.randomUUID();
  const now = new Date();

  await using tx = await db.begin();
  await tx.exec`
    INSERT INTO conversations (id, name, is_group, created_by, created_at, updated_at)
    VALUES (${conversationId}, ${name || null}, ${isGroup}, ${currentUserId}, ${now}, ${now})
  `;

  for (const userId of allParticipantIds) {
    await tx.exec`
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES (${conversationId}, ${userId})
    `;
  }

  const newConv = await getConversationById(conversationId, currentUserId);
  if (!newConv) throw APIError.internal("Failed to create conversation");
  return newConv;
});


// === Get Conversation Details ===

export interface GetConversationRequest {
  conversationId: string;
}

// getConversation retrieves details and messages for a specific conversation.
export const getConversation = api<GetConversationRequest, ConversationDetails>({
  expose: true,
  method: "GET",
  path: "/conversations/:conversationId",
}, async ({ conversationId }) => {
  const currentUserId = 'user-1';
  const conversation = await getConversationById(conversationId, currentUserId);
  if (!conversation) {
    throw APIError.notFound("Conversation not found");
  }

  const messageRows = await db.queryAll<{
    id: string;
    sender_id: string;
    content: string;
    message_type: 'text' | 'file' | 'system';
    attachment: string | null;
    created_at: Date;
  }>`
    SELECT id, sender_id, content, message_type, attachment, created_at
    FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
    LIMIT 100
  `;

  const usersById = new Map(conversation.participants.map(u => [u.id, u]));
  const messages: ChatMessage[] = messageRows.map(row => ({
    id: row.id,
    conversationId,
    sender: usersById.get(row.sender_id)!,
    content: row.content,
    type: row.message_type,
    attachment: row.attachment ? JSON.parse(row.attachment) : undefined,
    createdAt: row.created_at,
  }));

  return { ...conversation, messages };
});


// Helper function to get a single conversation summary
async function getConversationById(conversationId: string, currentUserId: string): Promise<ConversationSummary | null> {
  const row = await db.queryRow<{ id: string; name: string; is_group: boolean; updated_at: Date }>`
    SELECT id, name, is_group, updated_at FROM conversations WHERE id = ${conversationId}
  `;
  if (!row) return null;

  const participantRows = await db.queryAll<{ user_id: string }>`
    SELECT user_id FROM conversation_participants WHERE conversation_id = ${conversationId}
  `;
  const participantIds = participantRows.map(p => p.user_id);
  
  const allUsers = (await workspace.listUsers()).users;
  const participants = allUsers.filter(u => participantIds.includes(u.id));

  let name = row.name;
  if (!row.is_group) {
    const otherParticipant = participants.find(p => p.id !== currentUserId);
    name = otherParticipant?.name || 'Conversation';
  }

  return {
    id: row.id,
    name,
    isGroup: row.is_group,
    participants,
    updatedAt: row.updated_at,
  };
}
