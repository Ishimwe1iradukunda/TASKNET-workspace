import { api } from "encore.dev/api";
import { db } from "../db";

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

export interface ListAutomationsResponse {
  automations: Automation[];
}

// Retrieves all automation rules.
export const listAutomations = api<void, ListAutomationsResponse>(
  { expose: true, method: "GET", path: "/automations" },
  async () => {
    const rows = await db.queryAll<{
      id: string;
      name: string;
      description?: string;
      trigger_config: string;
      action_config: string;
      is_active: boolean;
      execution_count: number;
      created_at: Date;
      updated_at: Date;
    }>`SELECT * FROM automations ORDER BY created_at DESC`;
    
    const automations: Automation[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      trigger: JSON.parse(row.trigger_config),
      action: JSON.parse(row.action_config),
      isActive: row.is_active,
      executionCount: row.execution_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return { automations };
  }
);
