import { api, APIError } from "encore.dev/api";
import { db } from "../db";

export interface UpdateEmailRequest {
  id: string;
  isRead?: boolean;
}

// Updates an email's read status.
export const updateEmail = api<UpdateEmailRequest, void>(
  { expose: true, method: "PUT", path: "/emails/:id" },
  async (req) => {
    if (req.isRead === undefined) {
      return;
    }
    
    const result = await db.exec`
      UPDATE emails 
      SET is_read = ${req.isRead}
      WHERE id = ${req.id}
    `;
  }
);
