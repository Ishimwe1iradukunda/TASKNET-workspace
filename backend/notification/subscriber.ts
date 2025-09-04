import { Subscription } from "encore.dev/pubsub";
import { notificationTopic, NotificationEvent } from "./events";
import { db } from "./db";

// This subscription listens for notification events and stores them in the database.
new Subscription(notificationTopic, "store-notification", {
  handler: async (event: NotificationEvent) => {
    await db.exec`
      INSERT INTO notifications (id, user_id, type, title, body, entity_id, entity_type, is_read, created_at)
      VALUES (
        ${crypto.randomUUID()},
        ${event.userId},
        ${event.type},
        ${event.title},
        ${event.body},
        ${event.entityId},
        ${event.entityType},
        FALSE,
        NOW()
      )
    `;
  },
});
