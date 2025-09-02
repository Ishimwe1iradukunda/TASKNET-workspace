import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { db } from "../db";

export interface SearchRequest {
  query: Query<string>;
  type?: Query<"all" | "notes" | "tasks" | "projects" | "wikis" | "emails" | "documents">;
  limit?: Query<number>;
}

export interface SearchResult {
  id: string;
  type: "note" | "task" | "project" | "wiki" | "email" | "document";
  title: string;
  content?: string;
  excerpt: string;
  score: number;
  metadata: Record<string, any>;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  facets: {
    types: Array<{ type: string; count: number }>;
    tags: Array<{ tag: string; count: number }>;
  };
}

// Performs enterprise search across all content types.
export const enterpriseSearch = api<SearchRequest, SearchResponse>(
  { expose: true, method: "GET", path: "/search" },
  async (req) => {
    const limit = req.limit || 50;
    const searchTerm = `%${req.query}%`;
    const results: SearchResult[] = [];
    
    // Search notes
    if (!req.type || req.type === "all" || req.type === "notes") {
      const noteRows = await db.rawQueryAll<{
        id: string;
        title: string;
        content: string;
        tags: string;
        updated_at: Date;
      }>(
        `SELECT id, title, content, tags, updated_at 
         FROM notes 
         WHERE title ILIKE $1 OR content ILIKE $1
         ORDER BY updated_at DESC
         LIMIT $2`,
        searchTerm, Math.ceil(limit / 5)
      );
      
      results.push(...noteRows.map(row => ({
        id: row.id,
        type: "note" as const,
        title: row.title,
        content: row.content,
        excerpt: row.content.substring(0, 200) + "...",
        score: row.title.toLowerCase().includes(req.query.toLowerCase()) ? 1.0 : 0.8,
        metadata: { tags: JSON.parse(row.tags), updatedAt: row.updated_at },
      })));
    }
    
    // Search tasks
    if (!req.type || req.type === "all" || req.type === "tasks") {
      const taskRows = await db.rawQueryAll<{
        id: string;
        title: string;
        description: string;
        status: string;
        priority: string;
        tags: string;
        updated_at: Date;
      }>(
        `SELECT id, title, description, status, priority, tags, updated_at 
         FROM tasks 
         WHERE title ILIKE $1 OR description ILIKE $1
         ORDER BY updated_at DESC
         LIMIT $2`,
        searchTerm, Math.ceil(limit / 5)
      );
      
      results.push(...taskRows.map(row => ({
        id: row.id,
        type: "task" as const,
        title: row.title,
        content: row.description,
        excerpt: (row.description || "").substring(0, 200) + "...",
        score: row.title.toLowerCase().includes(req.query.toLowerCase()) ? 1.0 : 0.8,
        metadata: { 
          status: row.status, 
          priority: row.priority, 
          tags: JSON.parse(row.tags), 
          updatedAt: row.updated_at 
        },
      })));
    }
    
    // Search projects
    if (!req.type || req.type === "all" || req.type === "projects") {
      const projectRows = await db.rawQueryAll<{
        id: string;
        name: string;
        description: string;
        status: string;
        updated_at: Date;
      }>(
        `SELECT id, name, description, status, updated_at 
         FROM projects 
         WHERE name ILIKE $1 OR description ILIKE $1
         ORDER BY updated_at DESC
         LIMIT $2`,
        searchTerm, Math.ceil(limit / 5)
      );
      
      results.push(...projectRows.map(row => ({
        id: row.id,
        type: "project" as const,
        title: row.name,
        content: row.description,
        excerpt: (row.description || "").substring(0, 200) + "...",
        score: row.name.toLowerCase().includes(req.query.toLowerCase()) ? 1.0 : 0.8,
        metadata: { status: row.status, updatedAt: row.updated_at },
      })));
    }
    
    // Search wikis
    if (!req.type || req.type === "all" || req.type === "wikis") {
      const wikiRows = await db.rawQueryAll<{
        id: string;
        title: string;
        content: string;
        tags: string;
        updated_at: Date;
      }>(
        `SELECT id, title, content, tags, updated_at 
         FROM wikis 
         WHERE title ILIKE $1 OR content ILIKE $1
         ORDER BY updated_at DESC
         LIMIT $2`,
        searchTerm, Math.ceil(limit / 5)
      );
      
      results.push(...wikiRows.map(row => ({
        id: row.id,
        type: "wiki" as const,
        title: row.title,
        content: row.content,
        excerpt: row.content.substring(0, 200) + "...",
        score: row.title.toLowerCase().includes(req.query.toLowerCase()) ? 1.0 : 0.8,
        metadata: { tags: JSON.parse(row.tags), updatedAt: row.updated_at },
      })));
    }
    
    // Sort by score and limit results
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    // Generate facets
    const typeCounts = results.reduce((acc, result) => {
      acc[result.type] = (acc[result.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const tagCounts = results.reduce((acc, result) => {
      const tags = result.metadata.tags || [];
      tags.forEach((tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
    
    return {
      results: sortedResults,
      totalCount: results.length,
      facets: {
        types: Object.entries(typeCounts).map(([type, count]) => ({ type, count })),
        tags: Object.entries(tagCounts).map(([tag, count]) => ({ tag, count })),
      },
    };
  }
);
