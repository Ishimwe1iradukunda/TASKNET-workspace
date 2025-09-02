import { api } from "encore.dev/api";
import { db } from "../db";

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

export interface ListFormsResponse {
  forms: Form[];
}

// Retrieves all forms.
export const listForms = api<void, ListFormsResponse>(
  { expose: true, method: "GET", path: "/forms" },
  async () => {
    const rows = await db.queryAll<{
      id: string;
      name: string;
      description?: string;
      fields: string;
      submit_action: string;
      submission_count: number;
      created_at: Date;
      updated_at: Date;
    }>`SELECT * FROM forms ORDER BY created_at DESC`;
    
    const forms: Form[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      fields: JSON.parse(row.fields),
      submitAction: row.submit_action,
      submissionCount: row.submission_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return { forms };
  }
);
