import { api } from "encore.dev/api";
import { db } from "./db";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  entityId: string;
  entityType: string;
  isRead: boolean;
  createdAt: Date;
}

export interface ListNotificationsResponse {
  notifications: Notification[];
}

// listNotifications retrieves all notifications for the current user.
export const listNotifications = api<void, ListNotificationsResponse>({
  expose: true,
  method: "GET",
  path: "/notifications",
}, async () => {
  const userId = 'user-1'; // Static user ID for now

  const rows = await db.queryAll<any>`
    SELECT id, user_id, type, title, body, entity_id, entity_type, is_read, created_at
    FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  const notifications: Notification[] = rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    entityId: row.entity_id,
    entityType: row.entity_type,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));

  return { notifications };
});
