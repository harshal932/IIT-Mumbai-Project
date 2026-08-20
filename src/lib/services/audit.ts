import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import type { UserRole } from "@/lib/types";
import { logError } from "@/lib/utils/errors";
import crypto from "crypto";

interface AuditEntry {
  actorId?: string;
  actorRole?: UserRole | string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Write an audit log entry.
 * Never throws — audit failures must not break business logic.
 * IP addresses are hashed before storage to protect privacy.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const hashedIp = entry.ipAddress
      ? crypto
          .createHash("sha256")
          .update(entry.ipAddress + (process.env.AUTH_SECRET ?? ""))
          .digest("hex")
          .slice(0, 16)
      : undefined;

    await db.insert(auditLogs).values({
      actorId: entry.actorId ?? null,
      actorRole: entry.actorRole ?? null,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: (entry.metadata ?? {}) as Record<string, unknown>,
      ipAddress: hashedIp ?? null,
      userAgent: entry.userAgent ?? null,
    });
  } catch (err) {
    logError("AuditLog", err, { action: entry.action });
  }
}

/**
 * Fetch recent audit logs with pagination.
 */
export async function getAuditLogs(options: {
  page?: number;
  pageSize?: number;
  actorId?: string;
  action?: string;
}) {
  const { page = 1, pageSize = 50, actorId, action } = options;
  const offset = (page - 1) * pageSize;

  // Build dynamic WHERE — drizzle supports this with conditions
  const conditions = [];
  if (actorId) conditions.push(actorId);
  if (action) conditions.push(action);

  const rows = await db
    .select()
    .from(auditLogs)
    .orderBy(auditLogs.createdAt)
    .limit(pageSize)
    .offset(offset);

  return rows;
}
