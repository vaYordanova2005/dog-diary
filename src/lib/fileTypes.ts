// Shared rules for allowed files — used both in the browser (check before
// upload) and on the server. There is nothing secret here, so it can live in both.

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // Cloudinary free plan limit

// Photos are stored as "image", documents as "raw" (no processing by Cloudinary).
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"];
const DOCUMENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
const DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx"];

export type FileKind = { resourceType: "image" } | { resourceType: "raw"; extension: string };

// Recognizes the file by its type, and if the browser didn't say (common with HEIC from
// iPhone and old .doc on Windows) — by the extension in the name.
export function classifyFile(name: string, mimeType: string): FileKind | null {
  if (IMAGE_TYPES.includes(mimeType)) return { resourceType: "image" };
  if (mimeType in DOCUMENT_TYPES) return { resourceType: "raw", extension: DOCUMENT_TYPES[mimeType] };

  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXTENSIONS.includes(extension)) return { resourceType: "image" };
  if (DOCUMENT_EXTENSIONS.includes(extension)) return { resourceType: "raw", extension };
  return null;
}

// Check before upload. Returns the error text, or null if the file is fine.
export function validateFile(file: { name: string; type: string; size: number }): string | null {
  if (!classifyFile(file.name, file.type)) return "only photos, PDF and Word files are allowed";
  if (file.size > MAX_FILE_BYTES) return "the file is larger than 10 MB";
  return null;
}
