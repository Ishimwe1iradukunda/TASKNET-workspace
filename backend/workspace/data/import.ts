import { api } from "encore.dev/api";
import { db } from "../db";

export interface ImportDataRequest {
  notes?: any[];
  tasks?: any[];
  overwrite?: boolean;
}

export interface ImportDataResponse {
  imported: {
    notes: number;
    tasks: number;
  };
}

// Imports workspace data from JSON.
export const importData = api<ImportDataRequest, ImportDataResponse>(
  { expose: true, method: "POST", path: "/data/import" },
  async (req) => {
    let notesImported = 0;
    let tasksImported = 0;
    
    if (req.overwrite) {
      await db.exec`DELETE FROM notes`;
      await db.exec`DELETE FROM tasks`;
    }
    
    if (req.notes) {
      for (const note of req.notes) {
        const id = note.id || crypto.randomUUID();
        const now = new Date();
        
        await db.exec`
          INSERT INTO notes (id, title, content, tags, created_at, updated_at)
          VALUES (${id}, ${note.title}, ${note.content}, ${JSON.stringify(note.tags || [])}, 
                  ${note.created_at || now}, ${note.updated_at || now})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            tags = EXCLUDED.tags,
            updated_at = EXCLUDED.updated_at
        `;
        notesImported++;
      }
    }
    
    if (req.tasks) {
      for (const task of req.tasks) {
        const id = task.id || crypto.randomUUID();
        const now = new Date();
        
        await db.exec`
          INSERT INTO tasks (id, title, description, tags, status, priority, due_date, created_at, updated_at)
          VALUES (${id}, ${task.title}, ${task.description || null}, ${JSON.stringify(task.tags || [])}, 
                  ${task.status || "todo"}, ${task.priority || "medium"}, ${task.due_date || null},
                  ${task.created_at || now}, ${task.updated_at || now})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            tags = EXCLUDED.tags,
            status = EXCLUDED.status,
            priority = EXCLUDED.priority,
            due_date = EXCLUDED.due_date,
            updated_at = EXCLUDED.updated_at
        `;
        tasksImported++;
      }
    }
    
    return {
      imported: {
        notes: notesImported,
        tasks: tasksImported,
      },
    };
  }
);
