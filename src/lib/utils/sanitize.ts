/**
 * Sanitize user-generated text content.
 * Strips all HTML tags to prevent XSS — we store and display plain text only.
 * Rich formatting (if needed later) should use a strict allowlist parser.
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();
}

/**
 * Sanitize a URL — ensures it uses http or https only.
 * Returns null if unsafe or invalid.
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Escape special regex characters.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validate that a filename has a safe extension and format.
 */
export function isSafeFilename(filename: string): boolean {
  const ALLOWED = /^[\w\-. ]+\.(jpg|jpeg|png|gif|webp|mp4|mov|pdf)$/i;
  return ALLOWED.test(filename) && !filename.includes("..");
}

/**
 * Validate MIME type against an allowlist.
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];
export const ALLOWED_MEDIA_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
];

export function isAllowedMediaType(mimeType: string): boolean {
  return ALLOWED_MEDIA_TYPES.includes(mimeType);
}

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
