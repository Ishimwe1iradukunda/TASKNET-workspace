import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("workspace");

export interface CreateProjectRequest {
  name: string;
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

// Creates a new project.
export const createProject = api<CreateProjectRequest, Project>(
  { expose: true, method: "POST", path: "/projects" },
  async (req) => {
    const id = crypto.randomUUID();
    const now = new Date();
    
    await db.exec`
      INSERT INTO projects (id, name, description, status, start_date, end_date, created_at, updated_at)
      VALUES (${id}, ${req.name}, ${req.description || null}, ${req.status || "active"}, 
              ${req.startDate || null}, ${req.endDate || null}, ${now}, ${now})
    `;
    
    return {
      id,
      name: req.name,
      description: req.description,
      status: req.status || "active",
      startDate: req.startDate,
      endDate: req.endDate,
      createdAt: now,
      updatedAt: now,
    };
  }
);
