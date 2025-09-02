import { api, APIError } from "encore.dev/api";
import { db } from "../db";

export interface GetNoteRequest {
  id: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Retrieves a specific note by ID.
export const getNote = api<GetNoteRequest, Note>(
  { expose: true, method: "GET", path: "/notes/:id" },
  async (req) => {
    const row = await db.queryRow<{
      id: string;
      title: string;
      content: string;
      tags: string;
      created_at: Date;
      updated_at: Date;
    }>`SELECT * FROM notes WHERE id = ${req.id}`;
    
    if (!row) {
      throw APIError.notFound("note not found");
    }
    
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      tags: JSON.parse(row.tags),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
);
