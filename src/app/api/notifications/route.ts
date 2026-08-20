import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/helpers";
import { toClientError, statusFromError } from "@/lib/utils/errors";

// GET /api/notifications
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const url = req.nextUrl;
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = 30;
    const offset = (page - 1) * pageSize;
    const unreadOnly = url.searchParams.get("unread") === "1";

    const where = [eq(notifications.userId, session.user.id)];
    if (unreadOnly) where.push(eq(notifications.isRead, false));

    const [rows, [{ count }], [{ unreadCount }]] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(and(...where))
        .orderBy(desc(notifications.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(notifications)
        .where(and(...where)),
      db
        .select({ unreadCount: sql<number>`COUNT(*)` })
        .from(notifications)
        .where(and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false))),
    ]);

    return Response.json({
      items: rows.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      total: Number(count),
      page,
      pageSize,
      hasMore: page * pageSize < Number(count),
      unreadCount: Number(unreadCount),
    });
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}

// PATCH /api/notifications — mark all as read
export async function PATCH(_req: NextRequest) {
  try {
    const session = await requireAuth();
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, session.user.id));
    return Response.json({ data: { success: true } });
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}
