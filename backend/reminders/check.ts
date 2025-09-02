import { cron } from "encore.dev/cron";
import { db } from "../workspace/db";
import log from "encore.dev/log";

// This cron job runs every minute to check for reminders that are due.
export const checkReminders = cron("check-reminders", {
  schedule: "* * * * *", // Every minute
  handler: async () => {
    const now = new Date();
    
    const dueReminders = await db.queryAll<{ id: string; title: string }>`
      SELECT id, title FROM reminders
      WHERE remind_at <= ${now} AND is_triggered = FALSE
    `;

    if (dueReminders.length > 0) {
      log.info(`Found ${dueReminders.length} due reminders.`);
      
      for (const reminder of dueReminders) {
        // In a real application, you would publish an event to a topic
        // which would then be handled by a notification service (e.g., sending an email, push notification).
        // For this example, we'll just log it and mark it as triggered.
        log.info(`Triggering reminder: "${reminder.title}" (ID: ${reminder.id})`);
        
        await db.exec`
          UPDATE reminders
          SET is_triggered = TRUE
          WHERE id = ${reminder.id}
        `;
      }
    }
  },
});
