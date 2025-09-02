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
    // Search functionality has been removed
    return {
      results: [],
      totalCount: 0,
      facets: {
        types: [],
        tags: [],
      },
    };
  }
);
