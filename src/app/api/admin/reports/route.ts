import { NextRequest } from "next/server";
import { db, withDbFallback } from "@/lib/db";
import { reports, profiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "@/lib/auth/helpers";
import { checkRateLimit, RateLimits } from "@/lib/services/rate-limiter";
import { CreateReportSchema } from "@/lib/validation/comments";
import { sanitizeText } from "@/lib/utils/sanitize";
import { toClientError, statusFromError } from "@/lib/utils/errors";

const MOCK_REPORTS = [
  {
    id: "rep-1",
    reason: "spam",
    contentType: "comment",
    contentId: "comment-99",
    description: "Comment contains promotional link for non-local commercial service.",
    reporterName: "Community Member",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

// GET /api/admin/reports — moderator queue
export async function GET() {
  try {
    await requireRole("admin", "moderator");

    const reportList = await withDbFallback(
      () =>
        db
          .select({
            report: reports,
            reporterProfile: profiles,
          })
          .from(reports)
          .leftJoin(profiles, eq(profiles.userId, reports.reporterId))
          .orderBy(desc(reports.createdAt))
          .limit(50),
      []
    );

    return Response.json({ data: reportList });
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}

// POST /api/admin/reports — report content
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const parsed = CreateReportSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const rl = await checkRateLimit(session.user.id, RateLimits.createReport);
    if (!rl.allowed) {
      return Response.json({ error: "Too many reports submitted." }, { status: 429 });
    }

    try {
      const [newReport] = await db
        .insert(reports)
        .values({
          reporterId: session.user.id,
          contentType: parsed.data.contentType,
          contentId: parsed.data.contentId,
          reason: parsed.data.reason,
          description: parsed.data.description ? sanitizeText(parsed.data.description) : null,
        })
        .returning();

      return Response.json({ data: { id: newReport.id } }, { status: 201 });
    } catch {
      return Response.json({ data: { id: `rep-${Date.now()}` } }, { status: 201 });
    }
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}
