import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = SQLDatabase.named("workspace");

export interface ListProjectsRequest {
  status?: Query<"active" | "paused" | "completed" | "archived">;
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

export interface ListProjectsResponse {
  projects: Project[];
}

// Retrieves all projects, optionally filtered by status.
export const listProjects = api<ListProjectsRequest, ListProjectsResponse>(
  { expose: true, method: "GET", path: "/projects" },
  async (req) => {
    let query = `SELECT * FROM projects`;
    const params: any[] = [];
    
    if (req.status) {
      query += ` WHERE status = $1`;
      params.push(req.status);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const rows = await db.rawQueryAll<{
      id: string;
      name: string;
      description?: string;
      status: "active" | "paused" | "completed" | "archived";
      start_date?: Date;
      end_date?: Date;
      created_at: Date;
      updated_at: Date;
    }>(query, ...params);
    
    const projects: Project[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return { projects };
  }
);
