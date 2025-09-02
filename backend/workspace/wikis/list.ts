import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("workspace");

export interface ListWikisRequest {
  parentId?: Query<string>;
  search?: Query<string>;
}

export interface Wiki {
  id: string;
  title: string;
  content: string;
  tags: string[];
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListWikisResponse {
  wikis: Wiki[];
}

// Retrieves all wiki pages, optionally filtered by parent or search term.
export const listWikis = api<ListWikisRequest, ListWikisResponse>(
  { expose: true, method: "GET", path: "/wikis" },
  async (req) => {
    let query = `SELECT * FROM wikis`;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (req.parentId) {
      conditions.push(`parent_id = $${params.length + 1}`);
      params.push(req.parentId);
    } else if (req.parentId !== undefined) {
      conditions.push(`parent_id IS NULL`);
    }
    
    if (req.search) {
      conditions.push(`(title ILIKE $${params.length + 1} OR content ILIKE $${params.length + 1})`);
      params.push(`%${req.search}%`);
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
      parent_id?: string;
      created_at: Date;
      updated_at: Date;
    }>(query, ...params);
    
    const wikis: Wiki[] = rows.map(row => ({
      id: row.id,
      title: row.title,
      content: row.content,
      tags: JSON.parse(row.tags),
      parentId: row.parent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return { wikis };
  }
);
