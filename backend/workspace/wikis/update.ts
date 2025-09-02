import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("workspace");

export interface UpdateWikiRequest {
  id: string;
  title?: string;
  content?: string;
  tags?: string[];
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

// Updates an existing wiki page.
export const updateWiki = api<UpdateWikiRequest, Wiki>(
  { expose: true, method: "PUT", path: "/wikis/:id" },
  async (req) => {
    const existing = await db.queryRow<{
      id: string;
      title: string;
      content: string;
      tags: string;
      parent_id?: string;
      created_at: Date;
    }>`SELECT * FROM wikis WHERE id = ${req.id}`;
    
    if (!existing) {
      throw APIError.notFound("wiki page not found");
    }
    
    const now = new Date();
    const title = req.title !== undefined ? req.title : existing.title;
    const content = req.content !== undefined ? req.content : existing.content;
    const tags = req.tags !== undefined ? req.tags : JSON.parse(existing.tags);
    
    await db.exec`
      UPDATE wikis 
      SET title = ${title}, content = ${content}, tags = ${JSON.stringify(tags)}, updated_at = ${now}
      WHERE id = ${req.id}
    `;
    
    return {
      id: req.id,
      title,
      content,
      tags,
      parentId: existing.parent_id,
      createdAt: existing.created_at,
      updatedAt: now,
    };
  }
);
