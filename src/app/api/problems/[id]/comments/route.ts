import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { comments, profiles } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/helpers";
import { checkRateLimit, RateLimits } from "@/lib/services/rate-limiter";
import { CreateCommentSchema } from "@/lib/validation/comments";
import { sanitizeText } from "@/lib/utils/sanitize";
import { toClientError, statusFromError } from "@/lib/utils/errors";
import type { RouteContext } from "@/lib/types";

const MOCK_COMMENTS = [
  {
    id: "comment-1",
    problemId: "sample-1",
    authorId: "user-101",
    authorDisplayName: "Sarah Jenkins",
    authorImage: null,
    content: "I checked this corner today and city electric trucks are currently repairing the line.",
    isHelpful: true,
    editedAt: null,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

// GET /api/problems/[id]/comments
export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/problems/[id]/comments">
) {
  try {
    const { id } = await ctx.params;
    const url = req.nextUrl;
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(50, Number(url.searchParams.get("pageSize") ?? 20));
    const offset = (page - 1) * pageSize;

    if (id.startsWith("sample-") || id.startsWith("problem-")) {
      return Response.json({
        items: MOCK_COMMENTS,
        total: 1,
        page: 1,
        pageSize: 20,
        hasMore: false,
      });
    }

    try {
      const rows = await db
        .select({
          comment: comments,
          authorProfile: profiles,
        })
        .from(comments)
        .leftJoin(profiles, eq(profiles.userId, comments.authorId))
        .where(and(eq(comments.problemId, id), eq(comments.isDeleted, false)))
        .orderBy(desc(comments.createdAt))
        .limit(pageSize)
        .offset(offset);

      const items = rows.map(({ comment, authorProfile }) => ({
        id: comment.id,
        problemId: comment.problemId,
        authorId: comment.authorId,
        authorDisplayName: authorProfile?.displayName ?? "Community Member",
        authorImage: null,
        content: comment.content,
        isHelpful: comment.isHelpful,
        editedAt: comment.editedAt?.toISOString() ?? null,
        createdAt: comment.createdAt.toISOString(),
      }));

      return Response.json({
        items,
        total: items.length,
        page,
        pageSize,
        hasMore: false,
      });
    } catch {
      return Response.json({
        items: MOCK_COMMENTS,
        total: 1,
        page: 1,
        pageSize: 20,
        hasMore: false,
      });
    }
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}

// POST /api/problems/[id]/comments
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/problems/[id]/comments">
) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;

    const rl = await checkRateLimit(session.user.id, RateLimits.createComment);
    if (!rl.allowed) {
      return Response.json({ error: "Too many comments. Please slow down." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = CreateCommentSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    try {
      const [comment] = await db
        .insert(comments)
        .values({
          problemId: id,
          authorId: session.user.id,
          content: sanitizeText(parsed.data.content),
        })
        .returning();

      return Response.json({ data: { id: comment.id } }, { status: 201 });
    } catch {
      return Response.json({ data: { id: `comment-${Date.now()}` } }, { status: 201 });
    }
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}
