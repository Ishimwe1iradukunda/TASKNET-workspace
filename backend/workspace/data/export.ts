import { api } from "encore.dev/api";
import { db } from "../db";

export interface ExportDataResponse {
  notes: any[];
  tasks: any[];
  wikis: any[];
  projects: any[];
  documents: any[];
  exportedAt: Date;
}

// Exports all workspace data as JSON.
export const exportData = api<void, ExportDataResponse>(
  { expose: true, method: "GET", path: "/data/export" },
  async () => {
    const notesRows = await db.queryAll`SELECT * FROM notes ORDER BY created_at DESC`;
    const tasksRows = await db.queryAll`SELECT * FROM tasks ORDER BY created_at DESC`;
    const wikisRows = await db.queryAll`SELECT * FROM wikis ORDER BY created_at DESC`;
    const projectsRows = await db.queryAll`SELECT * FROM projects ORDER BY created_at DESC`;
    const documentsRows = await db.queryAll`SELECT * FROM documents ORDER BY created_at DESC`;
    
    const notes = notesRows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags as string),
    }));
    
    const tasks = tasksRows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags as string),
    }));

    const wikis = wikisRows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags as string),
    }));

    const projects = projectsRows.map(row => ({ ...row }));
    const documents = documentsRows.map(row => ({ ...row }));
    
    return {
      notes,
      tasks,
      wikis,
      projects,
      documents,
      exportedAt: new Date(),
    };
  }
);
