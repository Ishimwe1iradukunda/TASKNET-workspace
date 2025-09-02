import { api } from "encore.dev/api";
import { db } from "../db";

export interface DeleteEmailRequest {
  id: string;
}

// Deletes an email.
export const deleteEmail = api<DeleteEmailRequest, void>(
  { expose: true, method: "DELETE", path: "/emails/:id" },
  async (req) => {
    await db.exec`DELETE FROM emails WHERE id = ${req.id}`;
  }
);
