import { api, APIError } from "encore.dev/api";
import { db } from "../db";

export interface DeleteTaskRequest {
  id: string;
}

// Deletes a task.
export const deleteTask = api<DeleteTaskRequest, void>(
  { expose: true, method: "DELETE", path: "/tasks/:id" },
  async (req) => {
    const existing = await db.queryRow`SELECT id FROM tasks WHERE id = ${req.id}`;
    
    if (!existing) {
      throw APIError.notFound("task not found");
    }
    
    await db.exec`DELETE FROM tasks WHERE id = ${req.id}`;
  }
);
