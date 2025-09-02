import { api } from "encore.dev/api";
import { db } from "../workspace/db";

export interface CreateReminderRequest {
  title: string;
  description?: string;
  remindAt: Date;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  remindAt: Date;
  isTriggered: boolean;
  createdAt: Date;
}

// Creates a new reminder.
export const createReminder = api<CreateReminderRequest, Reminder>(
  { expose: true, method: "POST", path: "/reminders" },
  async (req) => {
    const id = crypto.randomUUID();
    const now = new Date();
    
    await db.exec`
      INSERT INTO reminders (id, title, description, remind_at, is_triggered, created_at)
      VALUES (${id}, ${req.title}, ${req.description || null}, ${req.remindAt}, FALSE, ${now})
    `;
    
    return {
      id,
      title: req.title,
      description: req.description,
      remindAt: req.remindAt,
      isTriggered: false,
      createdAt: now,
    };
  }
);
