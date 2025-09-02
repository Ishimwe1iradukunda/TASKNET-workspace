import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("workspace");

export interface UpdateProjectRequest {
  id: string;
  name?: string;
  description?: string;
  status?: "active" | "paused" | "completed" | "archived";
  startDate?: Date;
  endDate?: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "paused" | "completed" | "archived";
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Updates an existing project.
export const updateProject = api<UpdateProjectRequest, Project>(
  { expose: true, method: "PUT", path: "/projects/:id" },
  async (req) => {
    const existing = await db.queryRow<{
      id: string;
      name: string;
      description?: string;
      status: "active" | "paused" | "completed" | "archived";
      start_date?: Date;
      end_date?: Date;
      created_at: Date;
    }>`SELECT * FROM projects WHERE id = ${req.id}`;
    
    if (!existing) {
      throw APIError.notFound("project not found");
    }
    
    const now = new Date();
    const name = req.name !== undefined ? req.name : existing.name;
    const description = req.description !== undefined ? req.description : existing.description;
    const status = req.status !== undefined ? req.status : existing.status;
    const startDate = req.startDate !== undefined ? req.startDate : existing.start_date;
    const endDate = req.endDate !== undefined ? req.endDate : existing.end_date;
    
    await db.exec`
      UPDATE projects 
      SET name = ${name}, description = ${description}, status = ${status}, 
          start_date = ${startDate}, end_date = ${endDate}, updated_at = ${now}
      WHERE id = ${req.id}
    `;
    
    return {
      id: req.id,
      name,
      description,
      status,
      startDate,
      endDate,
      createdAt: existing.created_at,
      updatedAt: now,
    };
  }
);
