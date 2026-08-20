import { NextRequest } from "next/server";
import { db, withDbFallback } from "@/lib/db";
import { verifications, problems } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/helpers";
import { checkRateLimit, RateLimits } from "@/lib/services/rate-limiter";
import { CreateVerificationSchema } from "@/lib/validation/comments";
import { sanitizeText } from "@/lib/utils/sanitize";
import { isDemoProblemId } from "@/lib/utils/demo";
import { toClientError, statusFromError, NotFoundError, ConflictError } from "@/lib/utils/errors";
import { awardReputation } from "@/lib/services/reputation";
import { createNotification } from "@/lib/services/notifications";
import { writeAuditLog } from "@/lib/services/audit";
import type { RouteContext } from "@/lib/types";

const VERIFY_CONFIRMATION_THRESHOLD = 5;

function demoVerifyResponse() {
  return Response.json({ data: { id: `verify-${Date.now()}` } }, { status: 201 });
}

// POST /api/problems/[id]/verify
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/problems/[id]/verify">
) {
  try {
    const { id } = await ctx.params;

    const body = await req.json();
    const parsed = CreateVerificationSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    if (isDemoProblemId(id)) {
      return demoVerifyResponse();
    }

    const session = await requireAuth();

    const rl = await checkRateLimit(session.user.id, RateLimits.verifyProblem);
    if (!rl.allowed) {
      return Response.json({ error: "Too many verifications. Please slow down." }, { status: 429 });
    }

    const problem = await withDbFallback(async () => {
      const [row] = await db
        .select({ id: problems.id, authorId: problems.authorId, verificationCount: problems.verificationCount })
        .from(problems)
        .where(and(eq(problems.id, id), eq(problems.isDeleted, false)))
        .limit(1);
      return row ?? null;
    }, null);
    if (!problem) throw new NotFoundError("Problem");

    if (problem.authorId === session.user.id) {
      return Response.json({ error: "You cannot verify your own problem." }, { status: 422 });
    }

    const existing = await withDbFallback(async () => {
      const [row] = await db
        .select()
        .from(verifications)
        .where(and(eq(verifications.problemId, id), eq(verifications.verifierId, session.user.id)))
        .limit(1);
      return row ?? null;
    }, null);
    if (existing) throw new ConflictError("You have already verified this problem.");

    const verification = await withDbFallback(async () => {
      const [row] = await db
        .insert(verifications)
        .values({
          problemId: id,
          verifierId: session.user.id,
          verificationType: parsed.data.verificationType,
          note: parsed.data.note ? sanitizeText(parsed.data.note) : null,
        })
        .returning();
      return row ?? null;
    }, null);

    if (!verification) {
      return demoVerifyResponse();
    }

    const updated = await withDbFallback(async () => {
      const [row] = await db
        .update(problems)
        .set({ verificationCount: sql`${problems.verificationCount} + 1` })
        .where(eq(problems.id, id))
        .returning({ count: problems.verificationCount });
      return row ?? null;
    }, null);

    if (updated && updated.count >= VERIFY_CONFIRMATION_THRESHOLD) {
      await withDbFallback(
        () =>
          db
            .update(problems)
            .set({ verificationStatus: "community_confirmed" })
            .where(eq(problems.id, id)),
        null
      );
    } else if (updated && updated.count >= 2) {
      await withDbFallback(
        () =>
          db
            .update(problems)
            .set({ verificationStatus: "multiple_reports" })
            .where(eq(problems.id, id)),
        null
      );
    }

    if (parsed.data.verificationType === "confirm") {
      awardReputation({
        userId: session.user.id,
        eventType: "genuine_verification",
        referenceId: id,
        referenceType: "problem",
        actorId: session.user.id,
      }).catch(() => {});
    }

    createNotification({
      userId: problem.authorId,
      type: "verification_request",
      title: "Your problem was verified",
      message: `Someone ${parsed.data.verificationType === "confirm" ? "confirmed" : "disputed"} your problem.`,
      data: { problemId: id },
    }).catch(() => {});

    await writeAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "verification.create",
      targetType: "problem",
      targetId: id,
      metadata: { type: parsed.data.verificationType },
    });

    return Response.json({ data: { id: verification.id } }, { status: 201 });
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}
