import { api } from "encore.dev/api";
import { db } from "../db";

export interface CreateTaskRequest {
  title: string;
  description?: string;
  tags?: string[];
  status?: "todo" | "in-progress" | "done";
  priority?: "low" | "medium" | "high";
  dueDate?: Date;
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

// Creates a new task.
export const createTask = api<CreateTaskRequest, Task>(
  { expose: true, method: "POST", path: "/tasks" },
  async (req) => {
    const id = crypto.randomUUID();
    const now = new Date();
    
    await db.exec`
      INSERT INTO tasks (id, title, description, tags, status, priority, due_date, created_at, updated_at)
      VALUES (${id}, ${req.title}, ${req.description || null}, ${JSON.stringify(req.tags || [])}, 
              ${req.status || "todo"}, ${req.priority || "medium"}, ${req.dueDate || null}, ${now}, ${now})
    `;
    
    return {
      id,
      title: req.title,
      description: req.description,
      tags: req.tags || [],
      status: req.status || "todo",
      priority: req.priority || "medium",
      dueDate: req.dueDate,
      createdAt: now,
      updatedAt: now,
    };
  }
);
