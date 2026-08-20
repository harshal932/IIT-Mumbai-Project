import { NextRequest } from "next/server";
import { db, withDbFallback } from "@/lib/db";
import {
  problems,
  profiles,
  categories,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { fuzzyCoordinate } from "@/lib/utils/geo";
import { toClientError, statusFromError } from "@/lib/utils/errors";
import type { ProblemPublic, RouteContext } from "@/lib/types";

const MOCK_DETAIL_PROBLEM: ProblemPublic = {
  id: "sample-1",
  title: "Broken Streetlight at 5th Ave & 14th St",
  description: "The main corner streetlamp has been unlit for 3 nights. The area is pitch dark and unsafe for pedestrians walking from the subway at night.",
  categoryId: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1202",
  categoryName: "Street Lighting & Electricity",
  urgency: "high",
  problemType: "public",
  helpTypes: ["information", "authority_contact"],
  authorId: "user-1",
  authorDisplayName: "Alex M.",
  isAnonymous: false,
  latitude: 40.735,
  longitude: -73.994,
  locationArea: "5th Ave & 14th St, Manhattan",
  affectedCount: 45,
  startedAt: new Date().toISOString(),
  visibility: "public",
  status: "open",
  verificationStatus: "community_confirmed",
  viewCount: 128,
  followerCount: 14,
  commentCount: 6,
  media: [],
  createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  updatedAt: new Date().toISOString(),
};

// GET /api/problems/[id]
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/problems/[id]">
) {
  try {
    const { id } = await ctx.params;

    if (id.startsWith("sample-") || id.startsWith("problem-")) {
      return Response.json({
        data: {
          problem: { ...MOCK_DETAIL_PROBLEM, id },
          updates: [],
          verificationCount: 5,
          helpOfferCount: 2,
          isFollowing: false,
          hasOfferedHelp: false,
        },
      });
    }

    const rows = await withDbFallback(
      () =>
        db
          .select({
            problem: problems,
            authorProfile: profiles,
            categoryName: categories.name,
          })
          .from(problems)
          .leftJoin(profiles, eq(profiles.userId, problems.authorId))
          .leftJoin(categories, eq(categories.id, problems.categoryId))
          .where(and(eq(problems.id, id), eq(problems.isDeleted, false)))
          .limit(1),
      []
    );

    if (rows.length === 0) {
      return Response.json({
        data: {
          problem: { ...MOCK_DETAIL_PROBLEM, id },
          updates: [],
          verificationCount: 5,
          helpOfferCount: 2,
          isFollowing: false,
          hasOfferedHelp: false,
        },
      });
    }

    const { problem, authorProfile, categoryName } = rows[0];

    const { lat: fLat, lon: fLon } = fuzzyCoordinate(
      parseFloat(problem.latitude as string),
      parseFloat(problem.longitude as string),
      0.3
    );

    const problemData: ProblemPublic = {
      id: problem.id,
      title: problem.title,
      description: problem.description,
      categoryId: problem.categoryId ?? "",
      categoryName: categoryName ?? undefined,
      urgency: problem.urgency as never,
      problemType: problem.problemType as never,
      helpTypes: (problem.helpTypes ?? []) as never,
      authorId: problem.authorId,
      authorDisplayName: problem.isAnonymous
        ? "Anonymous"
        : authorProfile?.displayName ?? "Community Member",
      isAnonymous: problem.isAnonymous,
      latitude: fLat,
      longitude: fLon,
      locationArea: problem.locationArea,
      affectedCount: problem.affectedCount,
      startedAt: problem.startedAt?.toISOString() ?? null,
      visibility: problem.visibility as never,
      status: problem.status as never,
      verificationStatus: problem.verificationStatus as never,
      viewCount: problem.viewCount,
      followerCount: problem.followerCount,
      commentCount: problem.commentCount,
      media: [],
      createdAt: problem.createdAt.toISOString(),
      updatedAt: problem.updatedAt.toISOString(),
    };

    return Response.json({
      data: {
        problem: problemData,
        updates: [],
        verificationCount: 5,
        helpOfferCount: 2,
        isFollowing: false,
        hasOfferedHelp: false,
      },
    });
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}
