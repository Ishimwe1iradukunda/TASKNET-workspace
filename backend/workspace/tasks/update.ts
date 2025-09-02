import { api, APIError } from "encore.dev/api";
import { db } from "../db";

export interface UpdateTaskRequest {
  id: string;
  title?: string;
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

// Updates an existing task.
export const updateTask = api<UpdateTaskRequest, Task>(
  { expose: true, method: "PUT", path: "/tasks/:id" },
  async (req) => {
    const existing = await db.queryRow<{
      id: string;
      title: string;
      description?: string;
      tags: string;
      status: "todo" | "in-progress" | "done";
      priority: "low" | "medium" | "high";
      due_date?: Date;
      created_at: Date;
    }>`SELECT * FROM tasks WHERE id = ${req.id}`;
    
    if (!existing) {
      throw APIError.notFound("task not found");
    }
    
    const now = new Date();
    const title = req.title !== undefined ? req.title : existing.title;
    const description = req.description !== undefined ? req.description : existing.description;
    const tags = req.tags !== undefined ? req.tags : JSON.parse(existing.tags);
    const status = req.status !== undefined ? req.status : existing.status;
    const priority = req.priority !== undefined ? req.priority : existing.priority;
    const dueDate = req.dueDate !== undefined ? req.dueDate : existing.due_date;
    
    await db.exec`
      UPDATE tasks 
      SET title = ${title}, description = ${description}, tags = ${JSON.stringify(tags)}, 
          status = ${status}, priority = ${priority}, due_date = ${dueDate}, updated_at = ${now}
      WHERE id = ${req.id}
    `;
    
    return {
      id: req.id,
      title,
      description,
      tags,
      status,
      priority,
      dueDate,
      createdAt: existing.created_at,
      updatedAt: now,
    };
  }
);
