import { NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";
import { NotFoundError, toClientError, statusFromError } from "@/lib/utils/errors";
import type { RouteContext } from "@/lib/types";

const UPLOADS_DIR = path.join(process.cwd(), ".uploads");

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/media/[key]">
) {
  try {
    const { key } = await ctx.params;
    const decodedKey = Buffer.from(key, "base64url").toString("utf-8");

    // Prevent directory traversal
    const safePath = path.normalize(path.join(UPLOADS_DIR, decodedKey));
    if (!safePath.startsWith(UPLOADS_DIR)) {
      throw new NotFoundError("File");
    }

    try {
      const fileBuffer = await fs.readFile(safePath);
      const ext = path.extname(safePath).toLowerCase();

      const mimeTypes: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
      };

      const contentType = mimeTypes[ext] || "application/octet-stream";

      return new Response(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      throw new NotFoundError("File");
    }
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}
