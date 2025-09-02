import { api } from "encore.dev/api";
import { db } from "../db";

export interface CreateNoteRequest {
  title: string;
  content: string;
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

// Creates a new note.
export const createNote = api<CreateNoteRequest, Note>(
  { expose: true, method: "POST", path: "/notes" },
  async (req) => {
    const id = crypto.randomUUID();
    const now = new Date();
    
    await db.exec`
      INSERT INTO notes (id, title, content, tags, created_at, updated_at)
      VALUES (${id}, ${req.title}, ${req.content}, ${JSON.stringify(req.tags || [])}, ${now}, ${now})
    `;
    
    return {
      id,
      title: req.title,
      content: req.content,
      tags: req.tags || [],
      createdAt: now,
      updatedAt: now,
    };
  }
);
