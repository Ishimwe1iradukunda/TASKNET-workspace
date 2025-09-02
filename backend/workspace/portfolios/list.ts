import { api } from "encore.dev/api";
import { db } from "../db";

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  projectIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListPortfoliosResponse {
  portfolios: Portfolio[];
}

// Retrieves all portfolios.
export const listPortfolios = api<void, ListPortfoliosResponse>(
  { expose: true, method: "GET", path: "/portfolios" },
  async () => {
    const rows = await db.queryAll<{
      id: string;
      name: string;
      description?: string;
      project_ids: string;
      created_at: Date;
      updated_at: Date;
    }>`SELECT * FROM portfolios ORDER BY created_at DESC`;
    
    const portfolios: Portfolio[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      projectIds: JSON.parse(row.project_ids),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    
    return { portfolios };
  }
);
