import { api } from "encore.dev/api";
import { db } from "../db";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface ListUsersResponse {
  users: User[];
}

// listUsers retrieves all users in the workspace.
export const listUsers = api<void, ListUsersResponse>({
  expose: true,
  method: "GET",
  path: "/users",
}, async () => {
  const rows = await db.queryAll<{
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  }>`SELECT id, name, email, avatar_url FROM users`;

  return {
    users: rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      avatarUrl: row.avatar_url,
    })),
  };
});
