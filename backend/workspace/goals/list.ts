import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { db } from "../db";

export interface ListGoalsRequest {
  projectId?: Query<string>;
  status?: Query<"not_started" | "in_progress" | "completed" | "overdue">;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  dueDate?: Date;
  projectId?: string;
  progress: number;
  status: "not_started" | "in_progress" | "completed" | "overdue";
  createdAt: Date;
  updatedAt: Date;
}

export interface ListGoalsResponse {
  goals: Goal[];
}

// Retrieves goals with optional filters.
export const listGoals = api<ListGoalsRequest, ListGoalsResponse>(
  { expose: true, method: "GET", path: "/goals" },
  async (req) => {
    let query = `SELECT * FROM goals`;
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
    
    query += ` ORDER BY created_at DESC`;
    
    const rows = await db.rawQueryAll<{
      id: string;
      title: string;
      description?: string;
      target_value: number;
      current_value: number;
      unit: string;
      due_date?: Date;
      project_id?: string;
      progress: number;
      status: "not_started" | "in_progress" | "completed" | "overdue";
      created_at: Date;
      updated_at: Date;
    }>(query, ...params);
    
    const goals: Goal[] = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      targetValue: row.target_value,
      currentValue: row.current_value,
      unit: row.unit,
      dueDate: row.due_date,
      projectId: row.project_id,
      progress: row.progress,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return { goals };
  }
);
