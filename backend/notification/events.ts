import { Topic } from "encore.dev/pubsub";

export interface NotificationEvent {
  userId: string;
  type: 'task_due' | 'project_update' | 'new_mention' | 'reminder_due';
  title: string;
  body: string;
  entityId: string;
  entityType: 'task' | 'project' | 'note' | 'reminder';
}

// notificationTopic is a pub/sub topic for sending notifications.
export const notificationTopic = new Topic<NotificationEvent>("notification-events", {
  deliveryGuarantee: "at-least-once",
});
