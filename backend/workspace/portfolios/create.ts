import { api } from "encore.dev/api";
import { db } from "../db";

export interface CreatePortfolioRequest {
  name: string;
  description?: string;
  projectIds: string[];
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  projectIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new portfolio.
export const createPortfolio = api<CreatePortfolioRequest, Portfolio>(
  { expose: true, method: "POST", path: "/portfolios" },
  async (req) => {
    const id = crypto.randomUUID();
    const now = new Date();
    
    await db.exec`
      INSERT INTO portfolios (id, name, description, project_ids, created_at, updated_at)
      VALUES (${id}, ${req.name}, ${req.description || null}, ${JSON.stringify(req.projectIds)}, ${now}, ${now})
    `;
    
    return {
      id,
      name: req.name,
      description: req.description,
      projectIds: req.projectIds,
      createdAt: now,
      updatedAt: now,
    };
  }
);
