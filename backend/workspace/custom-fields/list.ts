import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { db } from "../db";

export interface ListCustomFieldsRequest {
  entityType?: Query<"task" | "project" | "note">;
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

export interface ListCustomFieldsResponse {
  fields: CustomField[];
}

// Retrieves custom fields with optional filters.
export const listCustomFields = api<ListCustomFieldsRequest, ListCustomFieldsResponse>(
  { expose: true, method: "GET", path: "/custom-fields" },
  async (req) => {
    let query = `SELECT * FROM custom_fields`;
    const params: any[] = [];
    
    if (req.entityType) {
      query += ` WHERE entity_type = $1`;
      params.push(req.entityType);
    }
    
    query += ` ORDER BY name ASC`;
    
    const rows = await db.rawQueryAll<{
      id: string;
      name: string;
      type: "text" | "number" | "date" | "boolean" | "select" | "multi_select";
      options: string;
      entity_type: "task" | "project" | "note";
      is_required: boolean;
      created_at: Date;
      updated_at: Date;
    }>(query, ...params);
    
    const fields: CustomField[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      options: JSON.parse(row.options),
      entityType: row.entity_type,
      isRequired: row.is_required,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return { fields };
  }
);
