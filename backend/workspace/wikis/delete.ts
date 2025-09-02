import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("workspace");

export interface DeleteWikiRequest {
  id: string;
}

// Deletes a wiki page.
export const deleteWiki = api<DeleteWikiRequest, void>(
  { expose: true, method: "DELETE", path: "/wikis/:id" },
  async (req) => {
    const existing = await db.queryRow`SELECT id FROM wikis WHERE id = ${req.id}`;
    
    if (!existing) {
      throw APIError.notFound("wiki page not found");
    }
    
    await db.exec`DELETE FROM wikis WHERE id = ${req.id}`;
  }
);
