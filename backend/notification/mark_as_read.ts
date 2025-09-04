import { api } from "encore.dev/api";
import { db } from "./db";

export interface MarkAsReadRequest {
  id: string;
}

// markAsRead marks a single notification as read.
export const markAsRead = api<MarkAsReadRequest, void>({
  expose: true,
  method: "PUT",
  path: "/notifications/:id/read",
}, async ({ id }) => {
  const userId = 'user-1'; // Static user ID for now

  await db.exec`
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = ${id} AND user_id = ${userId}
  `;
});

// markAllAsRead marks all unread notifications as read.
export const markAllAsRead = api<void, void>({
  expose: true,
  method: "PUT",
  path: "/notifications/read-all",
}, async () => {
  const userId = 'user-1'; // Static user ID for now

  await db.exec`
    UPDATE notifications
    SET is_read = TRUE
    WHERE is_read = FALSE AND user_id = ${userId}
  `;
});
