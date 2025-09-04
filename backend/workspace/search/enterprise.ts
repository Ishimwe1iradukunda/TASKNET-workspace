import { api, Query } from "encore.dev/api";
import { db } from "../db";

export interface SearchRequest {
  query: Query<string>;
  type?: Query<"all" | "notes" | "tasks" | "projects" | "wikis" | "documents">;
  limit?: Query<number>;
}

export interface SearchResult {
  id: string;
  type: "note" | "task" | "project" | "wiki" | "document";
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
    const q = (req.query ?? "").trim();
    const type = req.type ?? "all";
    const limit = Math.min(Math.max(Number(req.limit ?? 50), 1), 200);

    if (!q) {
      return {
        results: [],
        totalCount: 0,
        facets: { types: [], tags: [] },
      };
    }

    const like = `%${q}%`;

    const results: SearchResult[] = [];

    // Notes
    if (type === "all" || type === "notes") {
      const rows = await db.rawQueryAll<{
        id: string;
        title: string;
        content: string;
        tags: string; // jsonb text
        created_at: Date;
        updated_at: Date;
      }>(
        `
        SELECT id, title, content, tags::text as tags, created_at, updated_at
        FROM notes
        WHERE title ILIKE $1 OR content ILIKE $1 OR tags::text ILIKE $1
        ORDER BY updated_at DESC
        LIMIT $2
        `,
        like,
        limit
      );
      for (const row of rows) {
        const score =
          (row.title.toLowerCase().includes(q.toLowerCase()) ? 2 : 0) +
          (row.content.toLowerCase().includes(q.toLowerCase()) ? 1 : 0);
        results.push({
          id: row.id,
          type: "note",
          title: row.title,
          content: row.content,
          excerpt: createExcerpt(row.content, q),
          score,
          metadata: {
            updatedAt: row.updated_at,
            tags: safeParseJSON(row.tags, [] as string[]),
          },
        });
      }
    }

    // Tasks
    if (type === "all" || type === "tasks") {
      const rows = await db.rawQueryAll<{
        id: string;
        title: string;
        description: string | null;
        tags: string;
        status: string;
        priority: string;
        due_date: Date | null;
        updated_at: Date;
      }>(
        `
        SELECT id, title, description, tags::text as tags, status, priority, due_date, updated_at
        FROM tasks
        WHERE title ILIKE $1 OR coalesce(description, '') ILIKE $1 OR tags::text ILIKE $1
        ORDER BY updated_at DESC
        LIMIT $2
        `,
        like,
        limit
      );
      for (const row of rows) {
        const d = row.description ?? "";
        const score =
          (row.title.toLowerCase().includes(q.toLowerCase()) ? 2 : 0) +
          (d.toLowerCase().includes(q.toLowerCase()) ? 1 : 0);
        results.push({
          id: row.id,
          type: "task",
          title: row.title,
          content: d,
          excerpt: createExcerpt(d, q),
          score,
          metadata: {
            status: row.status,
            priority: row.priority,
            dueDate: row.due_date ?? undefined,
            updatedAt: row.updated_at,
            tags: safeParseJSON(row.tags, [] as string[]),
          },
        });
      }
    }

    // Projects
    if (type === "all" || type === "projects") {
      const rows = await db.rawQueryAll<{
        id: string;
        name: string;
        description: string | null;
        status: string;
        start_date: Date | null;
        end_date: Date | null;
        updated_at: Date;
      }>(
        `
        SELECT id, name, description, status, start_date, end_date, updated_at
        FROM projects
        WHERE name ILIKE $1 OR coalesce(description, '') ILIKE $1
        ORDER BY updated_at DESC
        LIMIT $2
        `,
        like,
        limit
      );
      for (const row of rows) {
        const d = row.description ?? "";
        const score =
          (row.name.toLowerCase().includes(q.toLowerCase()) ? 2 : 0) +
          (d.toLowerCase().includes(q.toLowerCase()) ? 1 : 0);
        results.push({
          id: row.id,
          type: "project",
          title: row.name,
          content: d,
          excerpt: createExcerpt(d, q),
          score,
          metadata: {
            status: row.status,
            startDate: row.start_date ?? undefined,
            endDate: row.end_date ?? undefined,
            updatedAt: row.updated_at,
          },
        });
      }
    }

    // Wikis
    if (type === "all" || type === "wikis") {
      const rows = await db.rawQueryAll<{
        id: string;
        title: string;
        content: string;
        tags: string;
        updated_at: Date;
      }>(
        `
        SELECT id, title, content, tags::text as tags, updated_at
        FROM wikis
        WHERE title ILIKE $1 OR content ILIKE $1 OR tags::text ILIKE $1
        ORDER BY updated_at DESC
        LIMIT $2
        `,
        like,
        limit
      );
      for (const row of rows) {
        const score =
          (row.title.toLowerCase().includes(q.toLowerCase()) ? 2 : 0) +
          (row.content.toLowerCase().includes(q.toLowerCase()) ? 1 : 0);
        results.push({
          id: row.id,
          type: "wiki",
          title: row.title,
          content: row.content,
          excerpt: createExcerpt(row.content, q),
          score,
          metadata: {
            updatedAt: row.updated_at,
            tags: safeParseJSON(row.tags, [] as string[]),
          },
        });
      }
    }

    // Documents
    if (type === "all" || type === "documents") {
      const rows = await db.rawQueryAll<{
        id: string;
        name: string;
        file_type: string;
        size: number;
        created_at: Date;
      }>(
        `
        SELECT id, name, file_type, size, created_at
        FROM documents
        WHERE name ILIKE $1 OR file_type ILIKE $1
        ORDER BY created_at DESC
        LIMIT $2
        `,
        like,
        limit
      );
      for (const row of rows) {
        const score = row.name.toLowerCase().includes(q.toLowerCase()) ? 2 : 0;
        results.push({
          id: row.id,
          type: "document",
          title: row.name,
          content: undefined,
          excerpt: `${row.file_type} • ${formatSize(row.size)}`,
          score,
          metadata: {
            fileType: row.file_type,
            size: row.size,
            createdAt: row.created_at,
          },
        });
      }
    }

    // compute facets
    const typeCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();

    for (const r of results) {
      typeCounts.set(r.type, (typeCounts.get(r.type) ?? 0) + 1);
      const tags = (r.metadata?.tags as string[] | undefined) ?? [];
      for (const t of tags) {
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      }
    }

    const facets = {
      types: Array.from(typeCounts.entries())
        .map(([t, c]) => ({ type: t, count: c }))
        .sort((a, b) => b.count - a.count),
      tags: Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 25),
    };

    // sort results by score then recency-ish
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ad = extractDate(a.metadata);
      const bd = extractDate(b.metadata);
      return (bd?.getTime() ?? 0) - (ad?.getTime() ?? 0);
    });

    const limited = results.slice(0, limit);

    return {
      results: limited,
      totalCount: results.length,
      facets,
    };
  }
);

function createExcerpt(text: string, q: string, radius = 60): string {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) {
    return text.slice(0, radius * 2) + (text.length > radius * 2 ? "…" : "");
  }
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + q.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

function safeParseJSON<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function extractDate(meta: Record<string, any>): Date | null {
  for (const k of ["updatedAt", "receivedAt", "createdAt", "dueDate", "startDate", "endDate"]) {
    const v = meta[k];
    if (v instanceof Date) return v;
    if (typeof v === "string" || typeof v === "number") {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
