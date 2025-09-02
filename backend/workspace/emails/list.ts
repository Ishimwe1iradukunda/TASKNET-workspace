import { api } from "encore.dev/api";
import { db } from "../db";

export interface Email {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  isRead: boolean;
  receivedAt: Date;
}

export interface ListEmailsResponse {
  emails: Email[];
}

// Retrieves all emails.
export const listEmails = api<void, ListEmailsResponse>(
  { expose: true, method: "GET", path: "/emails" },
  async () => {
    const rows = await db.queryAll<{
      id: string;
      sender: string;
      recipient: string;
      subject: string;
      body: string;
      is_read: boolean;
      received_at: Date;
    }>`SELECT * FROM emails ORDER BY received_at DESC`;
    
    const emails: Email[] = rows.map(row => ({
      id: row.id,
      sender: row.sender,
      recipient: row.recipient,
      subject: row.subject,
      body: row.body,
      isRead: row.is_read,
      receivedAt: row.received_at,
    }));
    
    return { emails };
  }
);
