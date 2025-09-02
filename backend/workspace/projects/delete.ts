import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("workspace");

export interface DeleteProjectRequest {
  id: string;
}

// Deletes a project.
export const deleteProject = api<DeleteProjectRequest, void>(
  { expose: true, method: "DELETE", path: "/projects/:id" },
  async (req) => {
    const existing = await db.queryRow`SELECT id FROM projects WHERE id = ${req.id}`;
    
    if (!existing) {
      throw APIError.notFound("project not found");
    }
    
    await db.exec`DELETE FROM projects WHERE id = ${req.id}`;
  }
);
