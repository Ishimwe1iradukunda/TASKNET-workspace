import { api, APIError } from "encore.dev/api";
import { db } from "../db";

export interface DeleteNoteRequest {
  id: string;
}

// Deletes a note.
export const deleteNote = api<DeleteNoteRequest, void>(
  { expose: true, method: "DELETE", path: "/notes/:id" },
  async (req) => {
    const existing = await db.queryRow`SELECT id FROM notes WHERE id = ${req.id}`;
    
    if (!existing) {
      throw APIError.notFound("note not found");
    }
    
    await db.exec`DELETE FROM notes WHERE id = ${req.id}`;
  }
);
