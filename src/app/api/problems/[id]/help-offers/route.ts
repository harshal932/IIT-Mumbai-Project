import { NextRequest } from "next/server";
import { db, withDbFallback } from "@/lib/db";
import { helpOffers, problems, profiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/helpers";
import { checkRateLimit, RateLimits } from "@/lib/services/rate-limiter";
import { CreateHelpOfferSchema } from "@/lib/validation/comments";
import { sanitizeText } from "@/lib/utils/sanitize";
import { isDemoProblemId } from "@/lib/utils/demo";
import { toClientError, statusFromError, NotFoundError, ConflictError } from "@/lib/utils/errors";
import { createNotification } from "@/lib/services/notifications";
import type { RouteContext } from "@/lib/types";

function demoOfferResponse() {
  return Response.json({ data: { id: `help-${Date.now()}` } }, { status: 201 });
}

// POST /api/problems/[id]/help-offers
export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/problems/[id]/help-offers">
) {
  try {
    const { id } = await ctx.params;

    const body = await req.json();
    const parsed = CreateHelpOfferSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    // Sample/demo problems are not stored in Postgres — complete the flow locally.
    if (isDemoProblemId(id)) {
      return demoOfferResponse();
    }

    const session = await requireAuth();

    const rl = await checkRateLimit(session.user.id, RateLimits.createHelpOffer);
    if (!rl.allowed) {
      return Response.json({ error: "Too many help offers. Please slow down." }, { status: 429 });
    }

    const problem = await withDbFallback(async () => {
      const [row] = await db
        .select({ id: problems.id, authorId: problems.authorId, status: problems.status })
        .from(problems)
        .where(and(eq(problems.id, id), eq(problems.isDeleted, false)))
        .limit(1);
      return row ?? null;
    }, null);

    if (!problem) throw new NotFoundError("Problem");

    if (["resolved", "closed", "archived"].includes(problem.status)) {
      return Response.json({ error: "This problem is no longer accepting help offers." }, { status: 422 });
    }

    if (problem.authorId === session.user.id) {
      return Response.json({ error: "You cannot offer help on your own problem." }, { status: 422 });
    }

    const existing = await withDbFallback(async () => {
      const [row] = await db
        .select()
        .from(helpOffers)
        .where(and(eq(helpOffers.helperId, session.user.id), eq(helpOffers.problemId, id)))
        .limit(1);
      return row ?? null;
    }, null);
    if (existing) throw new ConflictError("You have already offered help on this problem.");

    const offer = await withDbFallback(async () => {
      const [row] = await db
        .insert(helpOffers)
        .values({
          problemId: id,
          helperId: session.user.id,
          helpTypes: parsed.data.helpTypes,
          message: sanitizeText(parsed.data.message),
          isPrivate: parsed.data.isPrivate,
        })
        .returning();
      return row ?? null;
    }, null);

    if (!offer) {
      return demoOfferResponse();
    }

    createNotification({
      userId: problem.authorId,
      type: "help_offer",
      title: "Someone wants to help!",
      message: `A community member offered to help with your problem.`,
      data: { problemId: id, offerId: offer.id },
    }).catch(() => {});

    return Response.json({ data: { id: offer.id } }, { status: 201 });
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}

// GET /api/problems/[id]/help-offers — visible to problem author + mods
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/problems/[id]/help-offers">
) {
  try {
    const { id } = await ctx.params;

    if (isDemoProblemId(id)) {
      return Response.json({
        data: [
          {
            id: "help-demo-1",
            problemId: id,
            helperId: "user-101",
            helperDisplayName: "Sarah Jenkins",
            helpTypes: ["information", "authority_contact"],
            message:
              "I can share the 311 request number from last week's outage and follow up with DSNY/electric.",
            status: "pending",
            createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          },
        ],
      });
    }

    const session = await requireAuth();

    const problem = await withDbFallback(async () => {
      const [row] = await db
        .select({ authorId: problems.authorId })
        .from(problems)
        .where(eq(problems.id, id))
        .limit(1);
      return row ?? null;
    }, null);
    if (!problem) throw new NotFoundError("Problem");

    const isAuthor = problem.authorId === session.user.id;
    const isMod = ["moderator", "admin"].includes(session.user.role);

    if (!isAuthor && !isMod) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await withDbFallback(
      () =>
        db
          .select({
            offer: helpOffers,
            helperProfile: profiles,
          })
          .from(helpOffers)
          .leftJoin(profiles, eq(profiles.userId, helpOffers.helperId))
          .where(eq(helpOffers.problemId, id)),
      []
    );

    const items = rows.map(({ offer, helperProfile }) => ({
      id: offer.id,
      problemId: offer.problemId,
      helperId: offer.helperId,
      helperDisplayName: helperProfile?.displayName ?? "Community Member",
      helpTypes: offer.helpTypes,
      message: offer.message,
      status: offer.status,
      createdAt: offer.createdAt.toISOString(),
    }));

    return Response.json({ data: items });
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}
