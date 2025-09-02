import { Bucket } from "encore.dev/storage/objects";

export const documentsBucket = new Bucket("documents", {
  public: false,
});
