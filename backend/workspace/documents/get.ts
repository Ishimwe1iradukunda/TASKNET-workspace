import { api, APIError } from "encore.dev/api";
import { db } from "../db";
import { documentsBucket } from "./storage";

export interface GetDocumentRequest {
  id: string;
}

export interface GetDocumentResponse {
  downloadUrl: string;
}

// Gets a signed download URL for a document.
export const getDocument = api<GetDocumentRequest, GetDocumentResponse>(
  { expose: true, method: "GET", path: "/documents/:id/download-url" },
  async (req) => {
    const doc = await db.queryRow<{ path: string }>`
      SELECT path FROM documents WHERE id = ${req.id}
    `;
    if (!doc) {
      throw APIError.notFound("document not found");
    }

    const { url } = await documentsBucket.signedDownloadUrl(doc.path, {
      ttl: 3600, // 1 hour
    });

    return { downloadUrl: url };
  }
);
