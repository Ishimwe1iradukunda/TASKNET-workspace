import { api, APIError } from "encore.dev/api";
import { db } from "../db";
import { documentsBucket } from "./storage";

export interface DeleteDocumentRequest {
  id: string;
}

// Deletes a document.
export const deleteDocument = api<DeleteDocumentRequest, void>(
  { expose: true, method: "DELETE", path: "/documents/:id" },
  async (req) => {
    const doc = await db.queryRow<{ path: string }>`
      SELECT path FROM documents WHERE id = ${req.id}
    `;
    if (!doc) {
      throw APIError.notFound("document not found");
    }

    await documentsBucket.remove(doc.path);
    await db.exec`DELETE FROM documents WHERE id = ${req.id}`;
  }
);
