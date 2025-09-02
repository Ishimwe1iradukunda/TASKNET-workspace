import { api } from "encore.dev/api";
import { db } from "../db";

export interface CreateSprintRequest {
  name: string;
  projectId: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  capacity?: number;
}

export interface Sprint {
  id: string;
  name: string;
  projectId: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  capacity?: number;
  status: "planning" | "active" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new sprint.
export const createSprint = api<CreateSprintRequest, Sprint>(
  { expose: true, method: "POST", path: "/sprints" },
  async (req) => {
    const id = crypto.randomUUID();
    const now = new Date();
    
    await db.exec`
      INSERT INTO sprints (id, name, project_id, goal, start_date, end_date, capacity, status, created_at, updated_at)
      VALUES (${id}, ${req.name}, ${req.projectId}, ${req.goal || null}, 
              ${req.startDate}, ${req.endDate}, ${req.capacity || null}, 'planning', ${now}, ${now})
    `;
    
    return {
      id,
      name: req.name,
      projectId: req.projectId,
      goal: req.goal,
      startDate: req.startDate,
      endDate: req.endDate,
      capacity: req.capacity,
      status: "planning",
      createdAt: now,
      updatedAt: now,
    };
  }
);
