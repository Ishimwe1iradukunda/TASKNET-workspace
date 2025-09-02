import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("workspace");

export interface CreateWikiRequest {
  title: string;
  content: string;
  tags?: string[];
  parentId?: string;
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

// Creates a new wiki page.
export const createWiki = api<CreateWikiRequest, Wiki>(
  { expose: true, method: "POST", path: "/wikis" },
  async (req) => {
    const id = crypto.randomUUID();
    const now = new Date();
    
    await db.exec`
      INSERT INTO wikis (id, title, content, tags, parent_id, created_at, updated_at)
      VALUES (${id}, ${req.title}, ${req.content}, ${JSON.stringify(req.tags || [])}, 
              ${req.parentId || null}, ${now}, ${now})
    `;
    
    return {
      id,
      title: req.title,
      content: req.content,
      tags: req.tags || [],
      parentId: req.parentId,
      createdAt: now,
      updatedAt: now,
    };
  }
);
