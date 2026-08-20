import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { problems, problemUpdates, follows } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/helpers";
import { UpdateProblemStatusSchema } from "@/lib/validation/problems";
import { toClientError, statusFromError, NotFoundError, ForbiddenError } from "@/lib/utils/errors";
import { notifyFollowers } from "@/lib/services/notifications";
import { writeAuditLog } from "@/lib/services/audit";
import { awardReputation } from "@/lib/services/reputation";
import type { ProblemStatus, RouteContext } from "@/lib/types";

// Valid status transitions
const ALLOWED_TRANSITIONS: Record<ProblemStatus, ProblemStatus[]> = {
  open: ["receiving_support", "closed", "archived"],
  receiving_support: ["verification_in_progress", "help_matched", "open", "closed"],
  verification_in_progress: ["receiving_support", "help_matched", "disputed"],
  help_matched: ["action_in_progress", "open"],
  action_in_progress: ["awaiting_authority", "partially_solved", "solved_pending_confirmation"],
  awaiting_authority: ["action_in_progress", "partially_solved", "disputed"],
  partially_solved: ["action_in_progress", "solved_pending_confirmation", "resolved"],
  solved_pending_confirmation: ["resolved", "disputed", "action_in_progress"],
  resolved: ["archived"],
  closed: ["archived"],
  disputed: ["open", "receiving_support", "archived"],
  archived: [],
};

// POST /api/problems/[id]/status
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/problems/[id]/status">
) {
  try {
    const session = await requireAuth();
    const { id } = await ctx.params;

    const [problem] = await db
      .select({ id: problems.id, authorId: problems.authorId, status: problems.status })
      .from(problems)
      .where(and(eq(problems.id, id), eq(problems.isDeleted, false)))
      .limit(1);
    if (!problem) throw new NotFoundError("Problem");

    // Only author, org_member (with problem connection), authority, moderator, admin can change status
    const isAuthor = problem.authorId === session.user.id;
    const hasOverride = ["moderator", "admin", "authority", "org_member"].includes(session.user.role);
    if (!isAuthor && !hasOverride) throw new ForbiddenError();

    const body = await req.json();
    const parsed = UpdateProblemStatusSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { status: newStatus, message } = parsed.data;
    const currentStatus = problem.status as ProblemStatus;

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus as ProblemStatus)) {
      return Response.json(
        { error: `Cannot transition from "${currentStatus}" to "${newStatus}".` },
        { status: 422 }
      );
    }

    await db.transaction(async (tx) => {
      // Update status
      await tx
        .update(problems)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(problems.id, id));

      // Log update
      await tx.insert(problemUpdates).values({
        problemId: id,
        actorId: session.user.id,
        actorRole: session.user.role,
        updateType: "status_change",
        previousStatus: currentStatus,
        newStatus,
        message: message ?? null,
      });
    });

    // If resolved, award reputation to author
    if (newStatus === "resolved") {
      awardReputation({
        userId: problem.authorId,
        eventType: "problem_resolved",
        referenceId: id,
        referenceType: "problem",
      }).catch(() => {});
    }

    // Notify followers
    const followerRows = await db
      .select({ userId: follows.userId })
      .from(follows)
      .where(eq(follows.problemId, id));

    notifyFollowers(
      followerRows.map((r) => r.userId),
      {
        type: "status_change",
        title: `Problem status updated to "${newStatus.replace(/_/g, " ")}"`,
        message: message ?? "The problem status was updated.",
        data: { problemId: id, newStatus },
      }
    ).catch(() => {});

    await writeAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "problem.status_change",
      targetType: "problem",
      targetId: id,
      metadata: { from: currentStatus, to: newStatus },
    });

    return Response.json({ data: { success: true, status: newStatus } });
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}
