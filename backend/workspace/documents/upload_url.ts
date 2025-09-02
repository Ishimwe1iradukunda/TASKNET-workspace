import { api } from "encore.dev/api";
import { db } from "../db";
import { documentsBucket } from "./storage";

export interface GetUploadUrlRequest {
  name: string;
  type: string;
  size: number;
}

export interface GetUploadUrlResponse {
  uploadUrl: string;
  documentId: string;
}

// Generates a signed URL for uploading a document.
export const getUploadUrl = api<GetUploadUrlRequest, GetUploadUrlResponse>(
  { expose: true, method: "POST", path: "/documents/upload-url" },
  async (req) => {
    const id = crypto.randomUUID();
    const path = `${id}/${req.name}`;
    const now = new Date();

    await db.exec`
      INSERT INTO documents (id, name, path, file_type, size, created_at)
      VALUES (${id}, ${req.name}, ${path}, ${req.type}, ${req.size}, ${now})
    `;

    const { url } = await documentsBucket.signedUploadUrl(path, {
      ttl: 3600, // 1 hour
    });

    return {
      uploadUrl: url,
      documentId: id,
    };
  }
);
