import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { follows, problems } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/helpers";
import { toClientError, statusFromError, NotFoundError } from "@/lib/utils/errors";
import type { RouteContext } from "@/lib/types";

// POST /api/problems/[id]/follow — toggle follow
export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/problems/[id]/follow">
) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;

    // Verify problem exists
    const [problem] = await db
      .select({ id: problems.id })
      .from(problems)
      .where(and(eq(problems.id, id), eq(problems.isDeleted, false)))
      .limit(1);
    if (!problem) throw new NotFoundError("Problem");

    // Check if already following
    const [existing] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.userId, session.user.id), eq(follows.problemId, id)))
      .limit(1);

    if (existing) {
      // Unfollow
      await db
        .delete(follows)
        .where(and(eq(follows.userId, session.user.id), eq(follows.problemId, id)));
      await db
        .update(problems)
        .set({ followerCount: sql`GREATEST(0, ${problems.followerCount} - 1)` })
        .where(eq(problems.id, id));
      return Response.json({ data: { following: false } });
    } else {
      // Follow
      await db.insert(follows).values({ userId: session.user.id, problemId: id });
      await db
        .update(problems)
        .set({ followerCount: sql`${problems.followerCount} + 1` })
        .where(eq(problems.id, id));
      return Response.json({ data: { following: true } }, { status: 201 });
    }
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}
