import { db, withDbFallback } from "@/lib/db";
import { problems, profiles, categories } from "@/lib/db/schema";
import { eq, and, or, ilike, sql, desc, gte, lte } from "drizzle-orm";
import { ProblemCard } from "@/components/problems/problem-card";
import { boundingBox, haversineDistance, fuzzyCoordinate } from "@/lib/utils/geo";
import Link from "next/link";
import type { ProblemPublic, ProblemUrgency, ProblemStatus, ProblemType, HelpType, ProblemVisibility, VerificationStatus } from "@/lib/types";

interface FeedPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    urgency?: string;
    status?: string;
    lat?: string;
    lng?: string;
    distance?: string;
  }>;
}

const MOCK_PROBLEMS: ProblemPublic[] = [
  {
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

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams;
  const search = params.search;
  const category = params.category;
  const urgency = params.urgency as ProblemUrgency | undefined;
  const status = params.status as ProblemStatus | undefined;
  const lat = params.lat ? parseFloat(params.lat) : undefined;
  const lng = params.lng ? parseFloat(params.lng) : undefined;
  const distance = params.distance ? parseFloat(params.distance) : undefined;

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

  let mockFiltered = MOCK_PROBLEMS;
  if (urgency) mockFiltered = mockFiltered.filter((p) => p.urgency === urgency);
  if (status) mockFiltered = mockFiltered.filter((p) => p.status === status);
  if (search) {
    mockFiltered = mockFiltered.filter(
      (p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  const resultRows = await withDbFallback(
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
        .where(and(...where))
        .orderBy(desc(problems.rankingScore), desc(problems.createdAt))
        .limit(30),
    []
  );

  let formattedProblems: ProblemPublic[] = [];

  if (resultRows.length > 0) {
    let filtered = resultRows;
    if (lat && lng && distance) {
      filtered = resultRows.filter((r) => {
        const pLat = parseFloat(r.problem.latitude as string);
        const pLon = parseFloat(r.problem.longitude as string);
        return haversineDistance(lat, lng, pLat, pLon) <= distance;
      });
    }

    formattedProblems = filtered.map(({ problem, authorProfile, categoryName }) => {
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
        urgency: problem.urgency as ProblemUrgency,
        problemType: problem.problemType as ProblemType,
        helpTypes: (problem.helpTypes ?? []) as HelpType[],
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
        visibility: problem.visibility as ProblemVisibility,
        status: problem.status as ProblemStatus,
        verificationStatus: problem.verificationStatus as VerificationStatus,
        viewCount: problem.viewCount,
        followerCount: problem.followerCount,
        commentCount: problem.commentCount,
        media: [],
        createdAt: problem.createdAt.toISOString(),
        updatedAt: problem.updatedAt.toISOString(),
      };
    });
  } else {
    formattedProblems = mockFiltered;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Community Problem Feed
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Discover, verify, and offer help on nearby issues reported by local residents.
        </p>
      </div>

      {/* Urgency Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
        <span className="text-xs font-semibold text-gray-400 mr-2">Filter Urgency:</span>
        <Link
          href="/feed"
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            !urgency
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          All
        </Link>
        <Link
          href="/feed?urgency=critical"
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            urgency === "critical"
              ? "bg-red-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          Critical
        </Link>
        <Link
          href="/feed?urgency=high"
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            urgency === "high"
              ? "bg-amber-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          High
        </Link>
        <Link
          href="/feed?urgency=medium"
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            urgency === "medium"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          Medium
        </Link>
      </div>

      <div className="space-y-4">
        {formattedProblems.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-gray-500">
            No problems found matching your selected filters. Try broadening your search!
          </div>
        ) : (
          formattedProblems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))
        )}
      </div>
    </div>
  );
}
