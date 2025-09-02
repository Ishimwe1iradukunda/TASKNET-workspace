import { api, APIError } from "encore.dev/api";
import { db } from "../workspace/db";

export interface DeleteReminderRequest {
  id: string;
}

// Deletes a reminder.
export const deleteReminder = api<DeleteReminderRequest, void>(
  { expose: true, method: "DELETE", path: "/reminders/:id" },
  async (req) => {
    const result = await db.exec`
      DELETE FROM reminders WHERE id = ${req.id}
    `;
  }
);
