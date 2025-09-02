import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { db } from "../db";

export interface ListNotesRequest {
  search?: Query<string>;
  tag?: Query<string>;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListNotesResponse {
  notes: Note[];
}

// Retrieves all notes, optionally filtered by search term or tag.
export const listNotes = api<ListNotesRequest, ListNotesResponse>(
  { expose: true, method: "GET", path: "/notes" },
  async (req) => {
    let query = `SELECT * FROM notes`;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (req.search) {
      conditions.push(`(title ILIKE $${params.length + 1} OR content ILIKE $${params.length + 1})`);
      params.push(`%${req.search}%`);
    }
    
    if (req.tag) {
      conditions.push(`tags::text ILIKE $${params.length + 1}`);
      params.push(`%"${req.tag}"%`);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    
    query += ` ORDER BY updated_at DESC`;
    
    const rows = await db.rawQueryAll<{
      id: string;
      title: string;
      content: string;
      tags: string;
      created_at: Date;
      updated_at: Date;
    }>(query, ...params);
    
    const notes: Note[] = rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      tags: JSON.parse(row.tags),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return { notes };
  }
);
