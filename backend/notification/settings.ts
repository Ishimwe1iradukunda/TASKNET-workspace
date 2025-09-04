import { api } from "encore.dev/api";
import { db } from "./db";

export interface NotificationSettings {
  email: {
    taskDue: boolean;
    projectUpdate: boolean;
    newMention: boolean;
  };
  push: {
    taskDue: boolean;
    projectUpdate: boolean;
    newMention: boolean;
  };
}

export interface GetSettingsResponse {
  settings: NotificationSettings;
}

// getSettings retrieves notification settings for the current user.
export const getSettings = api<void, GetSettingsResponse>({
  expose: true,
  method: "GET",
  path: "/notifications/settings",
}, async () => {
  const userId = 'user-1'; // Static user ID for now

  const row = await db.queryRow<{ settings: string }>`
    SELECT settings FROM notification_settings WHERE user_id = ${userId}
  `;

  if (row) {
    return { settings: JSON.parse(row.settings) };
  }

  // Default settings
  const defaultSettings: NotificationSettings = {
    email: { taskDue: true, projectUpdate: true, newMention: true },
    push: { taskDue: true, projectUpdate: true, newMention: true },
  };
  return { settings: defaultSettings };
});

export interface UpdateSettingsRequest {
  settings: NotificationSettings;
}

// updateSettings updates notification settings for the current user.
export const updateSettings = api<UpdateSettingsRequest, void>({
  expose: true,
  method: "PUT",
  path: "/notifications/settings",
}, async ({ settings }) => {
  const userId = 'user-1'; // Static user ID for now

  await db.exec`
    INSERT INTO notification_settings (user_id, settings)
    VALUES (${userId}, ${JSON.stringify(settings)})
    ON CONFLICT (user_id) DO UPDATE SET settings = EXCLUDED.settings
  `;
});
