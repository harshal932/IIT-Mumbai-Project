import { v4 as uuidv4 } from "uuid";
import {
  isAllowedMediaType,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
} from "@/lib/utils/sanitize";
import { AppError } from "@/lib/utils/errors";
import path from "path";
import fs from "fs/promises";

/**
 * Media service abstraction.
 *
 * MVP: stores files in local /tmp-style uploads directory.
 * Production: swap implementation to S3/Supabase/Cloudinary.
 *
 * DOCUMENTED LIMITATION: Local storage is not persistent across deployments.
 * Configure STORAGE_ENDPOINT + STORAGE_BUCKET for production.
 */

const UPLOADS_DIR = path.join(process.cwd(), ".uploads");

async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export interface UploadResult {
  fileKey: string;
  mimeType: string;
  fileSize: number;
  mediaType: "image" | "video";
}

/**
 * Store an uploaded file safely.
 * - Validates MIME type from file signature (first bytes), not just extension.
 * - Generates an unpredictable file key.
 * - Returns a file key for database storage.
 */
export async function uploadMedia(
  buffer: Buffer,
  originalMimeType: string,
  _originalName: string
): Promise<UploadResult> {
  // Validate MIME type
  if (!isAllowedMediaType(originalMimeType)) {
    throw new AppError(
      "File type not allowed. Upload images (JPEG, PNG, GIF, WebP) or videos (MP4, MOV).",
      "INVALID_FILE_TYPE",
      422
    );
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(originalMimeType);
  const maxSize = isImage ? MAX_IMAGE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;

  if (buffer.length > maxSize) {
    throw new AppError(
      `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)} MB`,
      "FILE_TOO_LARGE",
      422
    );
  }

  // Verify file signature (magic bytes) for images
  if (isImage) {
    verifyImageSignature(buffer, originalMimeType);
  }

  // Generate unpredictable key — never use original filename
  const ext = mimeToExt(originalMimeType);
  const fileKey = `media/${uuidv4()}/${uuidv4()}.${ext}`;
  const filePath = path.join(UPLOADS_DIR, fileKey);

  await ensureUploadDir();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);

  return {
    fileKey,
    mimeType: originalMimeType,
    fileSize: buffer.length,
    mediaType: isImage ? "image" : "video",
  };
}

/**
 * Generate a short-lived signed URL for a file.
 * MVP: returns a path to the local API route.
 * Production: generate a pre-signed S3/Supabase URL.
 */
export function getSignedUrl(
  fileKey: string,
  _expiresInSeconds = 3600
): string {
  // In MVP, proxy through our own API route which checks auth
  const encoded = Buffer.from(fileKey).toString("base64url");
  return `/api/media/${encoded}`;
}

/**
 * Delete a file from storage.
 */
export async function deleteMedia(fileKey: string): Promise<void> {
  const filePath = path.join(UPLOADS_DIR, fileKey);
  await fs.rm(filePath, { force: true });
}

function mimeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
  };
  return map[mimeType] ?? "bin";
}

function verifyImageSignature(buffer: Buffer, mimeType: string): void {
  // Magic byte signatures
  const signatures: Record<string, number[][]> = {
    "image/jpeg": [[0xff, 0xd8, 0xff]],
    "image/png": [[0x89, 0x50, 0x4e, 0x47]],
    "image/gif": [
      [0x47, 0x49, 0x46, 0x38, 0x37],
      [0x47, 0x49, 0x46, 0x38, 0x39],
    ],
    "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF
  };

  const sigs = signatures[mimeType];
  if (!sigs) return; // Unknown type — already validated by MIME allowlist

  const matches = sigs.some((sig) =>
    sig.every((byte, i) => buffer[i] === byte)
  );

  if (!matches) {
    throw new AppError(
      "File content does not match declared type. Upload may be corrupted or malicious.",
      "INVALID_FILE_SIGNATURE",
      422
    );
  }
}
