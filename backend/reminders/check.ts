import { cron } from "encore.dev/cron";
import { db } from "../workspace/db";
import log from "encore.dev/log";
import { notificationTopic } from "../notification/events";

// This cron job runs every minute to check for reminders that are due.
export const checkReminders = cron("check-reminders", {
  schedule: "* * * * *", // Every minute
  handler: async () => {
    const now = new Date();
    
    const dueReminders = await db.queryAll<{ id: string; title: string; description: string | null }>`
      SELECT id, title, description FROM reminders
      WHERE remind_at <= ${now} AND is_triggered = FALSE
    `;

    if (dueReminders.length > 0) {
      log.info(`Found ${dueReminders.length} due reminders.`);
      
      for (const reminder of dueReminders) {
        log.info(`Triggering reminder: "${reminder.title}" (ID: ${reminder.id})`);
        
        // Publish a notification event
        await notificationTopic.publish({
          userId: 'user-1', // Static user ID for now
          type: 'reminder_due',
          title: reminder.title,
          body: reminder.description || `Your reminder is due!`,
          entityId: reminder.id,
          entityType: 'reminder',
        });
        
        await db.exec`
          UPDATE reminders
          SET is_triggered = TRUE
          WHERE id = ${reminder.id}
        `;
      }
    }
  },
});
