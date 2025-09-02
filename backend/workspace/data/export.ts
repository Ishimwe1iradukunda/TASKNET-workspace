import { api } from "encore.dev/api";
import { db } from "../db";

export interface ExportDataResponse {
  notes: any[];
  tasks: any[];
  exportedAt: Date;
}

// Exports all workspace data as JSON.
export const exportData = api<void, ExportDataResponse>(
  { expose: true, method: "GET", path: "/data/export" },
  async () => {
    const notesRows = await db.queryAll`SELECT * FROM notes ORDER BY created_at DESC`;
    const tasksRows = await db.queryAll`SELECT * FROM tasks ORDER BY created_at DESC`;
    
    const notes = notesRows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags as string),
    }));
    
    const tasks = tasksRows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags as string),
    }));
    
    return {
      notes,
      tasks,
      exportedAt: new Date(),
    };
  }
);
