import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { db } from "../db";

export interface ListTasksRequest {
  status?: Query<"todo" | "in-progress" | "done">;
  tag?: Query<string>;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListTasksResponse {
  tasks: Task[];
}

// Retrieves all tasks, optionally filtered by status or tag.
export const listTasks = api<ListTasksRequest, ListTasksResponse>(
  { expose: true, method: "GET", path: "/tasks" },
  async (req) => {
    let query = `SELECT * FROM tasks`;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (req.status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(req.status);
    }
    
    if (req.tag) {
      conditions.push(`tags::text ILIKE $${params.length + 1}`);
      params.push(`%"${req.tag}"%`);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const rows = await db.rawQueryAll<{
      id: string;
      title: string;
      description?: string;
      tags: string;
      status: "todo" | "in-progress" | "done";
      priority: "low" | "medium" | "high";
      due_date?: Date;
      created_at: Date;
      updated_at: Date;
    }>(query, ...params);
    
    const tasks: Task[] = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      tags: JSON.parse(row.tags),
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return { tasks };
  }
);
