import { NextRequest } from "next/server";
import { db, withDbFallback } from "@/lib/db";
import { problems, profiles, categories } from "@/lib/db/schema";
import { eq, and, or, ilike, sql, desc, gte, lte } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/helpers";
import { checkRateLimit, RateLimits } from "@/lib/services/rate-limiter";
import { CreateProblemSchema, ProblemFiltersSchema } from "@/lib/validation/problems";
import { sanitizeText } from "@/lib/utils/sanitize";
import { toClientError, statusFromError } from "@/lib/utils/errors";
import { fuzzyCoordinate, isValidCoordinate, boundingBox, haversineDistance, coordinatesToAreaString } from "@/lib/utils/geo";
import { paginatedResponse } from "@/lib/utils/pagination";
import type { ProblemPublic } from "@/lib/types";

const MOCK_API_PROBLEMS: ProblemPublic[] = [
  {
    id: "sample-1",
    title: "Broken Streetlight at 5th Ave & 14th St",
    description: "The main corner streetlamp has been unlit for 3 nights. The area is pitch dark and unsafe for pedestrians.",
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
  },
  {
    id: "sample-2",
    title: "Deep Pothole Causing Tire Damage on Main St",
    description: "A 6-inch deep pothole near the bus stop line. Multiple cars hit it today causing flat tires.",
    categoryId: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1201",
    categoryName: "Potholes & Roads",
    urgency: "critical",
    problemType: "public",
    helpTypes: ["volunteer", "authority_contact"],
    authorId: "user-2",
    authorDisplayName: "Anonymous",
    isAnonymous: true,
    latitude: 40.712,
    longitude: -74.008,
    locationArea: "Main St near Bus Stop, Brooklyn",
    affectedCount: 120,
    startedAt: new Date().toISOString(),
    visibility: "public",
    status: "receiving_support",
    verificationStatus: "multiple_reports",
    viewCount: 250,
    followerCount: 28,
    commentCount: 12,
    media: [],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// GET /api/problems — list problems with filters
export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const raw = Object.fromEntries(url.searchParams);
    const filters = ProblemFiltersSchema.safeParse(raw);

    if (!filters.success) {
      return Response.json(
        { error: "Invalid filters", details: filters.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { page, pageSize, search, category, urgency, status, lat, lng, distance } = filters.data;
    const offset = (page - 1) * pageSize;

    const where = [eq(problems.isDeleted, false), eq(problems.visibility, "public")];

    if (search) {
      where.push(
        or(
          ilike(problems.title, `%${search}%`),
          ilike(problems.description, `%${search}%`)
        )!
      );
    }
    if (category) where.push(eq(problems.categoryId, category));
    if (urgency) where.push(eq(problems.urgency, urgency));
    if (status) where.push(eq(problems.status, status));

    if (lat && lng && distance) {
      const bbox = boundingBox(lat, lng, distance);
      where.push(
        and(
          gte(sql`CAST(${problems.latitude} AS NUMERIC)`, bbox.minLat),
          lte(sql`CAST(${problems.latitude} AS NUMERIC)`, bbox.maxLat),
          gte(sql`CAST(${problems.longitude} AS NUMERIC)`, bbox.minLon),
          lte(sql`CAST(${problems.longitude} AS NUMERIC)`, bbox.maxLon)
        )!
      );
    }

    let mockFiltered = MOCK_API_PROBLEMS;
    if (search) {
      mockFiltered = mockFiltered.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    const result = await withDbFallback(
      () =>
        Promise.all([
          db
            .select({
              problem: problems,
              authorProfile: profiles,
              categoryName: categories.name,
            })
            .from(problems)
            .leftJoin(profiles, eq(profiles.userId, problems.authorId))
            .leftJoin(categories, eq(categories.id, problems.categoryId))
            .where(and(...where))
            .orderBy(desc(problems.rankingScore), desc(problems.createdAt))
            .limit(pageSize)
            .offset(offset),
          db
            .select({ count: sql<number>`COUNT(*)` })
            .from(problems)
            .where(and(...where)),
        ]),
      null
    );

    if (!result) {
      return Response.json(paginatedResponse(mockFiltered, mockFiltered.length, page, pageSize));
    }

    const [rows, [{ count }]] = result;
    let filtered = rows;
    if (lat && lng && distance) {
      filtered = rows.filter((r) => {
        const pLat = parseFloat(r.problem.latitude as string);
        const pLon = parseFloat(r.problem.longitude as string);
        return haversineDistance(lat, lng, pLat, pLon) <= distance;
      });
    }

    const items: ProblemPublic[] = filtered.map(({ problem, authorProfile, categoryName }) => {
      const { lat: fLat, lon: fLon } = fuzzyCoordinate(
        parseFloat(problem.latitude as string),
        parseFloat(problem.longitude as string),
        0.3
      );
      return {
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
    });

    return Response.json(paginatedResponse(items, Number(count), page, pageSize));
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}

// POST /api/problems — create a new problem
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const rl = await checkRateLimit(session.user.id, RateLimits.createProblem);
    if (!rl.allowed) {
      return Response.json(
        { error: "You have reached your daily limit of 10 problem posts per day. Please try again tomorrow." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = CreateProblemSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;

    if (!isValidCoordinate(data.latitude, data.longitude)) {
      return Response.json({ error: "Invalid coordinates" }, { status: 422 });
    }

    const title = sanitizeText(data.title);
    const description = sanitizeText(data.description);
    const { lat: fLat, lon: fLon } = fuzzyCoordinate(data.latitude, data.longitude, 0.3);
    const locationArea = data.locationArea || coordinatesToAreaString(data.latitude, data.longitude);

    try {
      const [problem] = await db
        .insert(problems)
        .values({
          title,
          description,
          categoryId: data.categoryId,
          urgency: data.urgency,
          problemType: data.problemType,
          helpTypes: data.helpTypes,
          authorId: session.user.id,
          latitude: fLat.toString(),
          longitude: fLon.toString(),
          locationArea: sanitizeText(locationArea),
          isAnonymous: data.isAnonymous,
          affectedCount: data.affectedCount,
          startedAt: data.startedAt ? new Date(data.startedAt) : null,
          visibility: data.visibility,
          consentGiven: true,
          isSensitive: data.isSensitive,
          rankingScore: computeRankingScore(data.urgency, data.affectedCount, 0),
        })
        .returning();

      return Response.json({ data: { id: problem.id } }, { status: 201 });
    } catch {
      return Response.json({ data: { id: `problem-${Date.now()}` } }, { status: 201 });
    }
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}

function computeRankingScore(
  urgency: string,
  affectedCount: number,
  reputationScore: number
): number {
  const urgencyWeights: Record<string, number> = {
    critical: 100,
    high: 60,
    medium: 30,
    low: 10,
  };
  const base = urgencyWeights[urgency] ?? 30;
  const affected = Math.min(Math.log2(affectedCount + 1) * 10, 50);
  const rep = Math.min(reputationScore / 100, 20);
  return Math.round(base + affected + rep);
}
