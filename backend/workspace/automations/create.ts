import { api } from "encore.dev/api";
import { db } from "../db";

export interface CreateAutomationRequest {
  name: string;
  description?: string;
  trigger: {
    type: "task_status_change" | "task_created" | "due_date_approaching" | "project_status_change";
    conditions: Record<string, any>;
  };
  action: {
    type: "send_notification" | "update_status" | "assign_user" | "create_task";
    parameters: Record<string, any>;
  };
  isActive?: boolean;
}

export interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: {
    type: string;
    conditions: Record<string, any>;
  };
  action: {
    type: string;
    parameters: Record<string, any>;
  };
  isActive: boolean;
  executionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new automation rule.
export const createAutomation = api<CreateAutomationRequest, Automation>(
  { expose: true, method: "POST", path: "/automations" },
  async (req) => {
    const id = crypto.randomUUID();
    const now = new Date();
    
    await db.exec`
      INSERT INTO automations (id, name, description, trigger_config, action_config, is_active, execution_count, created_at, updated_at)
      VALUES (${id}, ${req.name}, ${req.description || null}, ${JSON.stringify(req.trigger)}, 
              ${JSON.stringify(req.action)}, ${req.isActive || true}, 0, ${now}, ${now})
    `;
    
    return {
      id,
      name: req.name,
      description: req.description,
      trigger: req.trigger,
      action: req.action,
      isActive: req.isActive || true,
      executionCount: 0,
      createdAt: now,
      updatedAt: now,
    };
  }
);
