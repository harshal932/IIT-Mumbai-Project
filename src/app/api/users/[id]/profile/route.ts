import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, profiles, userSkills, userLanguages, userBadges, badges, userRoles } from "@/lib/db/schema";
import { eq, desc, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { toClientError, statusFromError, NotFoundError, ForbiddenError } from "@/lib/utils/errors";
import { sanitizeText, sanitizeUrl } from "@/lib/utils/sanitize";
import { UpdateProfileSchema } from "@/lib/validation/users";
import type { RouteContext } from "@/lib/types";

// GET /api/users/[id]/profile
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/users/[id]/profile">
) {
  try {
    const { id } = await ctx.params;
    const session = await auth();

    const [row] = await db
      .select({
        user: users,
        profile: profiles,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, id))
      .limit(1);

    if (!row || row.user.deletedAt) throw new NotFoundError("User");

    const { user, profile } = row;
    const isSelf = session?.user?.id === id;
    const isMod = ["moderator", "admin"].includes(session?.user?.role ?? "");

    // Fetch public data
    const [skills, languages, userBadgeRows] = await Promise.all([
      db.select().from(userSkills).where(eq(userSkills.userId, id)),
      db.select().from(userLanguages).where(eq(userLanguages.userId, id)),
      db
        .select({ badge: badges, awardedAt: userBadges.awardedAt })
        .from(userBadges)
        .leftJoin(badges, eq(badges.id, userBadges.badgeId))
        .where(eq(userBadges.userId, id)),
    ]);

    const publicProfile = {
      id: user.id,
      displayName: profile?.displayName ?? user.name ?? "Community Member",
      image: user.image,
      bio: profile?.bio ?? null,
      locationArea: profile?.locationArea ?? null,
      website: profile?.website ?? null,
      reputationScore: profile?.reputationScore ?? 0,
      trustLevel: profile?.trustLevel ?? "new",
      problemsPosted: profile?.problemsPosted ?? 0,
      helpActionsCompleted: profile?.helpActionsCompleted ?? 0,
      solvedProblems: profile?.solvedProblems ?? 0,
      skills: skills.map((s) => s.skill),
      languages: languages.map((l) => ({
        language: l.language,
        proficiency: l.proficiency,
      })),
      badges: userBadgeRows
        .filter((r) => r.badge)
        .map((r) => ({
          id: r.badge!.id,
          slug: r.badge!.slug,
          name: r.badge!.name,
          description: r.badge!.description,
          icon: r.badge!.icon,
          awardedAt: r.awardedAt.toISOString(),
        })),
      createdAt: user.createdAt.toISOString(),
      // Only self/mods see email and role
      ...(isSelf || isMod
        ? {
            email: user.email,
            primaryRole: user.primaryRole,
            isRestricted: user.isRestricted,
          }
        : {}),
    };

    return Response.json({ data: publicProfile });
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}

// PATCH /api/users/[id]/profile
export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/users/[id]/profile">
) {
  try {
    const { id } = await ctx.params;
    const session = await auth();

    // Only the user themselves can update their own profile
    if (!session?.user || session.user.id !== id) {
      throw new ForbiddenError();
    }

    const body = await req.json();
    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (data.displayName !== undefined)
      updates.displayName = sanitizeText(data.displayName);
    if (data.bio !== undefined) updates.bio = sanitizeText(data.bio);
    if (data.locationArea !== undefined)
      updates.locationArea = sanitizeText(data.locationArea);
    if (data.website !== undefined) {
      updates.website = data.website ? sanitizeUrl(data.website) : null;
    }
    if (data.notificationRadius !== undefined)
      updates.notificationRadius = data.notificationRadius;

    await db.update(profiles).set(updates).where(eq(profiles.userId, id));

    return Response.json({ data: { success: true } });
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}
