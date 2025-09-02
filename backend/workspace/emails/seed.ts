import { cron } from "encore.dev/cron";
import { db } from "../db";

// This cron job runs once every hour to seed the database with a new fake email.
// This is to simulate receiving new emails.
export const seedEmail = cron("seed-email", {
  schedule: "0 * * * *", // Every hour
  handler: async () => {
    const id = crypto.randomUUID();
    const now = new Date();
    const sender = "sender@example.com";
    const recipient = "you@example.com";
    const subject = `Hourly Update - ${now.toLocaleTimeString()}`;
    const body = `This is a simulated email received at ${now.toLocaleString()}.`;

    await db.exec`
      INSERT INTO emails (id, sender, recipient, subject, body, is_read, received_at)
      VALUES (${id}, ${sender}, ${recipient}, ${subject}, ${body}, false, ${now})
    `;
  },
});
