import { db, withDbFallback } from "@/lib/db";
import { follows, problems, profiles, categories } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { ProblemCard } from "@/components/problems/problem-card";
import { Bookmark } from "lucide-react";
import type { ProblemPublic, ProblemUrgency, ProblemStatus, ProblemType, HelpType, ProblemVisibility, VerificationStatus } from "@/lib/types";

const MOCK_SAVED_PROBLEMS: ProblemPublic[] = [
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
];

export default async function SavedProblemsPage() {
  const session = await auth();

  let savedProblems: ProblemPublic[] = MOCK_SAVED_PROBLEMS;

  if (session?.user?.id) {
    const resultRows = await withDbFallback(
      () =>
        db
          .select({
            problem: problems,
            authorProfile: profiles,
            categoryName: categories.name,
          })
          .from(follows)
          .innerJoin(problems, eq(problems.id, follows.problemId))
          .leftJoin(profiles, eq(profiles.userId, problems.authorId))
          .leftJoin(categories, eq(categories.id, problems.categoryId))
          .where(and(eq(follows.userId, session.user.id), eq(problems.isDeleted, false)))
          .orderBy(desc(follows.createdAt)),
      []
    );

    if (resultRows.length > 0) {
      savedProblems = resultRows.map(({ problem, authorProfile, categoryName }) => ({
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
        latitude: parseFloat(problem.latitude as string),
        longitude: parseFloat(problem.longitude as string),
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
      }));
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Bookmark className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          Saved & Bookmarked Problems
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Keep track of community problems you are following or contributing to.
        </p>
      </div>

      <div className="space-y-4">
        {savedProblems.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-gray-500">
            <Bookmark className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            You haven&apos;t saved any problems yet. Click the bookmark icon on any problem card to save it here!
          </div>
        ) : (
          savedProblems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))
        )}
      </div>
    </div>
  );
}
