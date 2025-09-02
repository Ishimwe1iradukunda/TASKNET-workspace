import { api } from "encore.dev/api";
import { db } from "../db";

export interface CreateCustomFieldRequest {
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select" | "multi_select";
  options?: string[]; // for select/multi_select types
  entityType: "task" | "project" | "note";
  isRequired?: boolean;
}

export interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select" | "multi_select";
  options?: string[];
  entityType: "task" | "project" | "note";
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new custom field.
export const createCustomField = api<CreateCustomFieldRequest, CustomField>(
  { expose: true, method: "POST", path: "/custom-fields" },
  async (req) => {
    const id = crypto.randomUUID();
    const now = new Date();
    
    await db.exec`
      INSERT INTO custom_fields (id, name, type, options, entity_type, is_required, created_at, updated_at)
      VALUES (${id}, ${req.name}, ${req.type}, ${JSON.stringify(req.options || [])}, 
              ${req.entityType}, ${req.isRequired || false}, ${now}, ${now})
    `;
    
    return {
      id,
      name: req.name,
      type: req.type,
      options: req.options,
      entityType: req.entityType,
      isRequired: req.isRequired || false,
      createdAt: now,
      updatedAt: now,
    };
  }
);
