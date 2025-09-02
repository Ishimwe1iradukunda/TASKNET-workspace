import { api } from "encore.dev/api";
import { db } from "../db";

export interface Document {
  id: string;
  name: string;
  path: string;
  fileType: string;
  size: number;
  createdAt: Date;
}

export interface ListDocumentsResponse {
  documents: Document[];
}

// Retrieves all documents.
export const listDocuments = api<void, ListDocumentsResponse>(
  { expose: true, method: "GET", path: "/documents" },
  async () => {
    const rows = await db.queryAll<{
      id: string;
      name: string;
      path: string;
      file_type: string;
      size: number;
      created_at: Date;
    }>`SELECT * FROM documents ORDER BY created_at DESC`;
    
    const documents: Document[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      path: row.path,
      fileType: row.file_type,
      size: row.size,
      createdAt: row.created_at,
    }));
    
    return { documents };
  }
);
