import { api } from "encore.dev/api";
import { db } from "../db";

export interface CreateFormRequest {
  name: string;
  description?: string;
  fields: Array<{
    name: string;
    type: "text" | "email" | "number" | "textarea" | "select" | "checkbox" | "date";
    label: string;
    required: boolean;
    options?: string[];
  }>;
  submitAction: "create_task" | "create_project" | "store_response";
}

export interface Form {
  id: string;
  name: string;
  description?: string;
  fields: Array<{
    name: string;
    type: string;
    label: string;
    required: boolean;
    options?: string[];
  }>;
  submitAction: string;
  submissionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new form.
export const createForm = api<CreateFormRequest, Form>(
  { expose: true, method: "POST", path: "/forms" },
  async (req) => {
    const id = crypto.randomUUID();
    const now = new Date();
    
    await db.exec`
      INSERT INTO forms (id, name, description, fields, submit_action, submission_count, created_at, updated_at)
      VALUES (${id}, ${req.name}, ${req.description || null}, ${JSON.stringify(req.fields)}, 
              ${req.submitAction}, 0, ${now}, ${now})
    `;
    
    return {
      id,
      name: req.name,
      description: req.description,
      fields: req.fields,
      submitAction: req.submitAction,
      submissionCount: 0,
      createdAt: now,
      updatedAt: now,
    };
  }
);
