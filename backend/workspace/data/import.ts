import { api } from "encore.dev/api";
import { db } from "../db";

export interface ImportDataRequest {
  notes?: any[];
  tasks?: any[];
  wikis?: any[];
  projects?: any[];
  emails?: any[];
  documents?: any[]; // Note: document files are not imported, only metadata.
  overwrite?: boolean;
}

export interface ImportDataResponse {
  imported: {
    notes: number;
    tasks: number;
    wikis: number;
    projects: number;
    emails: number;
    documents: number;
  };
}

// Imports workspace data from JSON.
export const importData = api<ImportDataRequest, ImportDataResponse>(
  { expose: true, method: "POST", path: "/data/import" },
  async (req) => {
    let notesImported = 0;
    let tasksImported = 0;
    let wikisImported = 0;
    let projectsImported = 0;
    let emailsImported = 0;
    let documentsImported = 0;
    
    if (req.overwrite) {
      await db.exec`DELETE FROM documents`;
      await db.exec`DELETE FROM emails`;
      await db.exec`DELETE FROM projects`;
      await db.exec`DELETE FROM wikis`;
      await db.exec`DELETE FROM tasks`;
      await db.exec`DELETE FROM notes`;
    }
    
    if (req.notes) {
      for (const note of req.notes) {
        await db.exec`
          INSERT INTO notes (id, title, content, tags, created_at, updated_at)
          VALUES (${note.id}, ${note.title}, ${note.content}, ${JSON.stringify(note.tags || [])}, 
                  ${note.created_at}, ${note.updated_at})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title, content = EXCLUDED.content, tags = EXCLUDED.tags, updated_at = EXCLUDED.updated_at
        `;
        notesImported++;
      }
    }
    
    if (req.tasks) {
      for (const task of req.tasks) {
        await db.exec`
          INSERT INTO tasks (id, title, description, tags, status, priority, due_date, created_at, updated_at)
          VALUES (${task.id}, ${task.title}, ${task.description}, ${JSON.stringify(task.tags || [])}, 
                  ${task.status}, ${task.priority}, ${task.due_date}, ${task.created_at}, ${task.updated_at})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title, description = EXCLUDED.description, tags = EXCLUDED.tags, status = EXCLUDED.status,
            priority = EXCLUDED.priority, due_date = EXCLUDED.due_date, updated_at = EXCLUDED.updated_at
        `;
        tasksImported++;
      }
    }

    if (req.wikis) {
      for (const wiki of req.wikis) {
        await db.exec`
          INSERT INTO wikis (id, title, content, tags, parent_id, created_at, updated_at)
          VALUES (${wiki.id}, ${wiki.title}, ${wiki.content}, ${JSON.stringify(wiki.tags || [])}, 
                  ${wiki.parent_id}, ${wiki.created_at}, ${wiki.updated_at})
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title, content = EXCLUDED.content, tags = EXCLUDED.tags, 
            parent_id = EXCLUDED.parent_id, updated_at = EXCLUDED.updated_at
        `;
        wikisImported++;
      }
    }

    if (req.projects) {
      for (const project of req.projects) {
        await db.exec`
          INSERT INTO projects (id, name, description, status, start_date, end_date, created_at, updated_at)
          VALUES (${project.id}, ${project.name}, ${project.description}, ${project.status}, 
                  ${project.start_date}, ${project.end_date}, ${project.created_at}, ${project.updated_at})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, description = EXCLUDED.description, status = EXCLUDED.status,
            start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date, updated_at = EXCLUDED.updated_at
        `;
        projectsImported++;
      }
    }

    if (req.emails) {
      for (const email of req.emails) {
        await db.exec`
          INSERT INTO emails (id, sender, recipient, subject, body, is_read, received_at)
          VALUES (${email.id}, ${email.sender}, ${email.recipient}, ${email.subject}, ${email.body}, 
                  ${email.is_read}, ${email.received_at})
          ON CONFLICT (id) DO UPDATE SET
            sender = EXCLUDED.sender, recipient = EXCLUDED.recipient, subject = EXCLUDED.subject,
            body = EXCLUDED.body, is_read = EXCLUDED.is_read, received_at = EXCLUDED.received_at
        `;
        emailsImported++;
      }
    }

    if (req.documents) {
      for (const doc of req.documents) {
        await db.exec`
          INSERT INTO documents (id, name, path, file_type, size, created_at)
          VALUES (${doc.id}, ${doc.name}, ${doc.path}, ${doc.file_type}, ${doc.size}, ${doc.created_at})
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name, path = EXCLUDED.path, file_type = EXCLUDED.file_type,
            size = EXCLUDED.size, created_at = EXCLUDED.created_at
        `;
        documentsImported++;
      }
    }
    
    return {
      imported: {
        notes: notesImported,
        tasks: tasksImported,
        wikis: wikisImported,
        projects: projectsImported,
        emails: emailsImported,
        documents: documentsImported,
      },
    };
  }
);
