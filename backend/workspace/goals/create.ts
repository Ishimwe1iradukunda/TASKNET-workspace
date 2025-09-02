import { api } from "encore.dev/api";
import { db } from "../db";

export interface CreateGoalRequest {
  title: string;
  description?: string;
  targetValue: number;
  currentValue?: number;
  unit: string;
  dueDate?: Date;
  projectId?: string;
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
  progress: number; // percentage
  status: "not_started" | "in_progress" | "completed" | "overdue";
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new goal.
export const createGoal = api<CreateGoalRequest, Goal>(
  { expose: true, method: "POST", path: "/goals" },
  async (req) => {
    const id = crypto.randomUUID();
    const now = new Date();
    const currentValue = req.currentValue || 0;
    const progress = Math.min(100, (currentValue / req.targetValue) * 100);
    
    let status: Goal["status"] = "not_started";
    if (currentValue >= req.targetValue) {
      status = "completed";
    } else if (currentValue > 0) {
      status = "in_progress";
    } else if (req.dueDate && req.dueDate < now) {
      status = "overdue";
    }
    
    await db.exec`
      INSERT INTO goals (id, title, description, target_value, current_value, unit, due_date, project_id, progress, status, created_at, updated_at)
      VALUES (${id}, ${req.title}, ${req.description || null}, ${req.targetValue}, ${currentValue}, ${req.unit}, 
              ${req.dueDate || null}, ${req.projectId || null}, ${progress}, ${status}, ${now}, ${now})
    `;
    
    return {
      id,
      title: req.title,
      description: req.description,
      targetValue: req.targetValue,
      currentValue,
      unit: req.unit,
      dueDate: req.dueDate,
      projectId: req.projectId,
      progress,
      status,
      createdAt: now,
      updatedAt: now,
    };
  }
);
