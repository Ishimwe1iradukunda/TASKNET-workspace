import { api, APIError } from "encore.dev/api";
import { db } from "../db";

export interface UpdateNoteRequest {
  id: string;
  title?: string;
  content?: string;
  tags?: string[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Updates an existing note.
export const updateNote = api<UpdateNoteRequest, Note>(
  { expose: true, method: "PUT", path: "/notes/:id" },
  async (req) => {
    const existing = await db.queryRow<{
      id: string;
      title: string;
      content: string;
      tags: string;
      created_at: Date;
    }>`SELECT * FROM notes WHERE id = ${req.id}`;
    
    if (!existing) {
      throw APIError.notFound("note not found");
    }
    
    const now = new Date();
    const title = req.title !== undefined ? req.title : existing.title;
    const content = req.content !== undefined ? req.content : existing.content;
    const tags = req.tags !== undefined ? req.tags : JSON.parse(existing.tags);
    
    await db.exec`
      UPDATE notes 
      SET title = ${title}, content = ${content}, tags = ${JSON.stringify(tags)}, updated_at = ${now}
      WHERE id = ${req.id}
    `;
    
    return {
      id: req.id,
      title,
      content,
      tags,
      createdAt: existing.created_at,
      updatedAt: now,
    };
  }
);
