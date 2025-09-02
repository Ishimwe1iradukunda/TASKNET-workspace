import { api } from "encore.dev/api";
import { db } from "../db";

export interface TimeEntry {
  id: string;
  taskId?: string;
  projectId?: string;
  description: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  isRunning: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTimeEntryRequest {
  taskId?: string;
  projectId?: string;
  description: string;
  startTime?: Date;
}

export interface UpdateTimeEntryRequest {
  id: string;
  description?: string;
  endTime?: Date;
  duration?: number;
}

export interface ListTimeEntriesRequest {
  taskId?: string;
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ListTimeEntriesResponse {
  entries: TimeEntry[];
  totalDuration: number;
}

// Starts a new time tracking entry.
export const startTimeEntry = api<CreateTimeEntryRequest, TimeEntry>(
  { expose: true, method: "POST", path: "/time/start" },
  async (req) => {
    const id = crypto.randomUUID();
    const now = new Date();
    const startTime = req.startTime || now;
    
    await db.exec`
      INSERT INTO time_entries (id, task_id, project_id, description, start_time, is_running, created_at, updated_at)
      VALUES (${id}, ${req.taskId || null}, ${req.projectId || null}, ${req.description}, 
              ${startTime}, true, ${now}, ${now})
    `;
    
    return {
      id,
      taskId: req.taskId,
      projectId: req.projectId,
      description: req.description,
      startTime,
      isRunning: true,
      createdAt: now,
      updatedAt: now,
    };
  }
);

// Stops a running time entry.
export const stopTimeEntry = api<UpdateTimeEntryRequest, TimeEntry>(
  { expose: true, method: "PUT", path: "/time/stop/:id" },
  async (req) => {
    const endTime = req.endTime || new Date();
    const now = new Date();
    
    const existing = await db.queryRow<{
      id: string;
      task_id?: string;
      project_id?: string;
      description: string;
      start_time: Date;
      created_at: Date;
    }>`SELECT * FROM time_entries WHERE id = ${req.id}`;
    
    if (!existing) {
      throw new Error("Time entry not found");
    }
    
    const duration = req.duration || Math.round((endTime.getTime() - existing.start_time.getTime()) / 60000);
    
    await db.exec`
      UPDATE time_entries 
      SET end_time = ${endTime}, duration = ${duration}, is_running = false, updated_at = ${now}
      WHERE id = ${req.id}
    `;
    
    return {
      id: req.id,
      taskId: existing.task_id,
      projectId: existing.project_id,
      description: existing.description,
      startTime: existing.start_time,
      endTime,
      duration,
      isRunning: false,
      createdAt: existing.created_at,
      updatedAt: now,
    };
  }
);

// Lists time entries with optional filters.
export const listTimeEntries = api<ListTimeEntriesRequest, ListTimeEntriesResponse>(
  { expose: true, method: "GET", path: "/time/entries" },
  async (req) => {
    let query = `SELECT * FROM time_entries`;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (req.taskId) {
      conditions.push(`task_id = $${params.length + 1}`);
      params.push(req.taskId);
    }
    
    if (req.projectId) {
      conditions.push(`project_id = $${params.length + 1}`);
      params.push(req.projectId);
    }
    
    if (req.startDate) {
      conditions.push(`start_time >= $${params.length + 1}`);
      params.push(req.startDate);
    }
    
    if (req.endDate) {
      conditions.push(`start_time <= $${params.length + 1}`);
      params.push(req.endDate);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    
    query += ` ORDER BY start_time DESC`;
    
    const rows = await db.rawQueryAll<{
      id: string;
      task_id?: string;
      project_id?: string;
      description: string;
      start_time: Date;
      end_time?: Date;
      duration?: number;
      is_running: boolean;
      created_at: Date;
      updated_at: Date;
    }>(query, ...params);
    
    const entries: TimeEntry[] = rows.map(row => ({
      id: row.id,
      taskId: row.task_id,
      projectId: row.project_id,
      description: row.description,
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration,
      isRunning: row.is_running,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    const totalDuration = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    
    return { entries, totalDuration };
  }
);
