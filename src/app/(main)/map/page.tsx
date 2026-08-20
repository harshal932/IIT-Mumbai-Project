import { db, withDbFallback } from "@/lib/db";
import { problems, profiles, categories } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ProblemMap } from "@/components/map/problem-map";
import { fuzzyCoordinate } from "@/lib/utils/geo";
import type { ProblemPublic, ProblemUrgency, ProblemStatus, ProblemType, HelpType, ProblemVisibility, VerificationStatus } from "@/lib/types";

const MOCK_MAP_PROBLEMS: ProblemPublic[] = [
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

export default async function MapPage() {
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
        .where(and(eq(problems.isDeleted, false), eq(problems.visibility, "public")))
        .orderBy(desc(problems.createdAt))
        .limit(50),
    []
  );

  let formattedProblems: ProblemPublic[] = [];

  if (resultRows.length > 0) {
    formattedProblems = resultRows.map(({ problem, authorProfile, categoryName }) => {
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
    formattedProblems = MOCK_MAP_PROBLEMS;
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <div className="mb-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Interactive Community Map
        </h1>
        <p className="text-xs text-gray-500">
          Browse issues geographically. Pins are fuzz-protected for resident privacy.
        </p>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xs">
        <ProblemMap problems={formattedProblems} />
      </div>
    </div>
  );
}
