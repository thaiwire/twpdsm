import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Statically scoped (not built from an env var) so Next.js file tracing doesn't
// pull the whole project into the server bundle. Override via a bind mount at
// this fixed path in deployment if a different location is needed.
const STORAGE_ROOT = path.join(process.cwd(), "storage", "documents");
const AVATAR_STORAGE_ROOT = path.join(process.cwd(), "storage", "avatars");

const DEFAULT_MAX_UPLOAD_SIZE_MB = 20;

export const MAX_UPLOAD_SIZE_MB = (() => {
  const parsed = Number(process.env.MAX_UPLOAD_SIZE_MB);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_UPLOAD_SIZE_MB;
})();

export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

const DEFAULT_MAX_AVATAR_SIZE_MB = 5;

export const MAX_AVATAR_SIZE_MB = (() => {
  const parsed = Number(process.env.MAX_AVATAR_SIZE_MB);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_AVATAR_SIZE_MB;
})();

export const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

const ALLOWED_AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function isAllowedAvatarMimeType(mimeType: string): boolean {
  return ALLOWED_AVATAR_MIME_TYPES.includes(mimeType);
}

function assertInsidePath(root: string, fullPath: string) {
  const resolved = path.resolve(fullPath);
  if (!resolved.startsWith(root)) {
    throw new Error("Resolved storage path escapes the storage root");
  }
  return resolved;
}

export async function saveDocumentFile(
  documentId: string,
  originalFileName: string,
  data: Buffer
): Promise<{ storagePath: string }> {
  const dir = path.join(STORAGE_ROOT, documentId);
  await mkdir(dir, { recursive: true });

  const safeExt = path.extname(originalFileName).slice(0, 20);
  const storedName = `${randomUUID()}${safeExt}`;
  const fullPath = assertInsidePath(STORAGE_ROOT, path.join(dir, storedName));

  await writeFile(fullPath, data);

  // store path relative to storage root so it stays portable across environments
  return { storagePath: path.join(documentId, storedName) };
}

export async function readDocumentFile(storagePath: string): Promise<Buffer> {
  const fullPath = assertInsidePath(STORAGE_ROOT, path.join(STORAGE_ROOT, storagePath));
  return readFile(fullPath);
}

export async function deleteDocumentFile(storagePath: string): Promise<void> {
  const fullPath = assertInsidePath(STORAGE_ROOT, path.join(STORAGE_ROOT, storagePath));
  await unlink(fullPath).catch(() => undefined);
}

export async function saveAvatarFile(
  userId: string,
  originalFileName: string,
  data: Buffer
): Promise<{ storagePath: string }> {
  await mkdir(AVATAR_STORAGE_ROOT, { recursive: true });

  const safeExt = path.extname(originalFileName).slice(0, 10) || ".jpg";
  const storedName = `${userId}-${randomUUID()}${safeExt}`;
  const fullPath = assertInsidePath(AVATAR_STORAGE_ROOT, path.join(AVATAR_STORAGE_ROOT, storedName));

  await writeFile(fullPath, data);

  return { storagePath: storedName };
}

export async function readAvatarFile(storagePath: string): Promise<Buffer> {
  const fullPath = assertInsidePath(AVATAR_STORAGE_ROOT, path.join(AVATAR_STORAGE_ROOT, storagePath));
  return readFile(fullPath);
}

export async function deleteAvatarFile(storagePath: string): Promise<void> {
  const fullPath = assertInsidePath(AVATAR_STORAGE_ROOT, path.join(AVATAR_STORAGE_ROOT, storagePath));
  await unlink(fullPath).catch(() => undefined);
}
