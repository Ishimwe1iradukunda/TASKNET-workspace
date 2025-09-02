import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { db } from "../db";

export interface ListSprintsRequest {
  projectId?: Query<string>;
  status?: Query<"planning" | "active" | "completed">;
}

export interface Sprint {
  id: string;
  name: string;
  projectId: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  capacity?: number;
  status: "planning" | "active" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface ListSprintsResponse {
  sprints: Sprint[];
}

// Retrieves sprints with optional filters.
export const listSprints = api<ListSprintsRequest, ListSprintsResponse>(
  { expose: true, method: "GET", path: "/sprints" },
  async (req) => {
    let query = `SELECT * FROM sprints`;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (req.projectId) {
      conditions.push(`project_id = $${params.length + 1}`);
      params.push(req.projectId);
    }
    
    if (req.status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(req.status);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    
    query += ` ORDER BY start_date DESC`;
    
    const rows = await db.rawQueryAll<{
      id: string;
      name: string;
      project_id: string;
      goal?: string;
      start_date: Date;
      end_date: Date;
      capacity?: number;
      status: "planning" | "active" | "completed";
      created_at: Date;
      updated_at: Date;
    }>(query, ...params);
    
    const sprints: Sprint[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      projectId: row.project_id,
      goal: row.goal,
      startDate: row.start_date,
      endDate: row.end_date,
      capacity: row.capacity,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return { sprints };
  }
);
