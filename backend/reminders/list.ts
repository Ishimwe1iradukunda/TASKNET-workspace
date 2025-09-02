import { api } from "encore.dev/api";
import { db } from "../workspace/db";

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  remindAt: Date;
  isTriggered: boolean;
  createdAt: Date;
}

export interface ListRemindersResponse {
  reminders: Reminder[];
}

// Retrieves all reminders.
export const listReminders = api<void, ListRemindersResponse>(
  { expose: true, method: "GET", path: "/reminders" },
  async () => {
    const rows = await db.queryAll<{
      id: string;
      title: string;
      description?: string;
      remind_at: Date;
      is_triggered: boolean;
      created_at: Date;
    }>`SELECT * FROM reminders ORDER BY remind_at ASC`;
    
    const reminders: Reminder[] = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      remindAt: row.remind_at,
      isTriggered: row.is_triggered,
      createdAt: row.created_at,
    }));
    
    return { reminders };
  }
);
