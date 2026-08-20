import { db, withDbFallback } from "@/lib/db";
import {
  problems,
  profiles,
  categories,
  comments,
  follows,
  helpOffers,
  verifications,
  problemUpdates,
} from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { Avatar } from "@/components/ui/avatar";
import { UrgencyBadge, StatusBadge, VerificationBadge } from "@/components/ui/badge";
import { CommentSection } from "@/components/problems/comment-section";
import { HelpOfferForm } from "@/components/problems/help-offer-form";
import { VerificationPanel } from "@/components/problems/verification-panel";
import { StatusTimeline } from "@/components/problems/status-timeline";
import { MapPin, Users, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CommentPublic, ProblemUrgency, ProblemType, HelpType, ProblemVisibility, ProblemStatus, VerificationStatus } from "@/lib/types";

interface ProblemDetailPageProps {
  params: Promise<{ id: string }>;
}

const MOCK_DETAIL_PROBLEM = {
  id: "sample-1",
  title: "Broken Streetlight at 5th Ave & 14th St",
  description: "The main corner streetlamp has been unlit for 3 nights. The area is pitch dark and unsafe for pedestrians walking from the subway at night. City electric department has been notified by multiple residents.",
  categoryId: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1202",
  categoryName: "Street Lighting & Electricity",
  urgency: "high" as ProblemUrgency,
  problemType: "public" as ProblemType,
  helpTypes: ["information", "authority_contact"] as HelpType[],
  authorId: "user-1",
  authorDisplayName: "Alex M.",
  isAnonymous: false,
  latitude: 40.735,
  longitude: -73.994,
  locationArea: "5th Ave & 14th St, Manhattan",
  affectedCount: 45,
  startedAt: new Date().toISOString() as string | null,
  visibility: "public" as ProblemVisibility,
  status: "open" as ProblemStatus,
  verificationStatus: "community_confirmed" as VerificationStatus,
  viewCount: 128,
  followerCount: 14,
  commentCount: 6,
  createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  updatedAt: new Date().toISOString(),
};

export default async function ProblemDetailPage({ params }: ProblemDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  let problemData = MOCK_DETAIL_PROBLEM;
  let formattedComments: CommentPublic[] = [];
  let updateRows: any[] = [];
  let verificationCount = 5;

  const dbRows = await withDbFallback(
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

  if (dbRows.length > 0) {
    const { problem, authorProfile, categoryName } = dbRows[0];
    problemData = {
      id: problem.id,
      title: problem.title,
      description: problem.description,
      categoryId: problem.categoryId ?? "",
      categoryName: categoryName ?? MOCK_DETAIL_PROBLEM.categoryName,
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
      createdAt: problem.createdAt.toISOString(),
      updatedAt: problem.updatedAt.toISOString(),
    };

    const [commentRows, updates, vCount] = await withDbFallback(
      () =>
        Promise.all([
          db
            .select({ comment: comments, authorProfile: profiles })
            .from(comments)
            .leftJoin(profiles, eq(profiles.userId, comments.authorId))
            .where(and(eq(comments.problemId, id), eq(comments.isDeleted, false)))
            .orderBy(desc(comments.createdAt))
            .limit(50),
          db.select().from(problemUpdates).where(eq(problemUpdates.problemId, id)),
          db.select({ count: sql<number>`COUNT(*)` }).from(verifications).where(eq(verifications.problemId, id)),
        ]),
      [[], [], [{ count: 5 }]]
    );

    formattedComments = commentRows.map(({ comment, authorProfile }) => ({
      id: comment.id,
      problemId: comment.problemId,
      authorId: comment.authorId,
      authorDisplayName: authorProfile?.displayName ?? "Community Member",
      authorImage: null,
      content: comment.content,
      isHelpful: comment.isHelpful,
      editedAt: comment.editedAt?.toISOString() ?? null,
      createdAt: comment.createdAt.toISOString(),
    }));
    updateRows = updates;
    verificationCount = Number(vCount[0]?.count || 5);
  }

  const isAuthor = session?.user?.id === problemData.authorId;
  const isClosed = ["resolved", "closed", "archived"].includes(problemData.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner / Title card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <UrgencyBadge urgency={problemData.urgency} />
            <StatusBadge status={problemData.status} />
            <VerificationBadge status={problemData.verificationStatus} />
          </div>
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(problemData.createdAt), { addSuffix: true })}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          {problemData.title}
        </h1>

        {/* Author info & Location metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Avatar name={problemData.authorDisplayName} size="sm" />
            <div>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {problemData.authorDisplayName}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-indigo-500" />
              {problemData.locationArea}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4 text-emerald-500" />
              {problemData.affectedCount} Affected
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4 text-gray-400" />
              {problemData.viewCount} Views
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid — Details & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Description & Comments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-2xs">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Problem Description
            </h3>
            <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
              {problemData.description}
            </p>

            {problemData.helpTypes && problemData.helpTypes.length > 0 && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-500 block mb-2">
                  Support Needed:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {problemData.helpTypes.map((ht) => (
                    <span
                      key={ht}
                      className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium capitalize"
                    >
                      {ht.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          {updateRows.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-2xs">
              <StatusTimeline
                events={updateRows.map((u) => ({
                  id: u.id,
                  actorId: u.actorId,
                  actorDisplayName: "User",
                  actorRole: u.actorRole as never,
                  updateType: u.updateType as never,
                  previousStatus: u.previousStatus as never,
                  newStatus: u.newStatus as never,
                  message: u.message,
                  createdAt: u.createdAt.toISOString(),
                }))}
              />
            </div>
          )}

          {/* Comment Section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-2xs">
            <CommentSection
              problemId={id}
              comments={formattedComments}
              currentUser={session?.user}
              isClosed={isClosed}
            />
          </div>
        </div>

        {/* Right Column: Actions & Verification */}
        <div className="space-y-6">
          {!isClosed && !isAuthor && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-2xs space-y-3">
              <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                Can You Assist?
              </h4>
              <p className="text-xs text-gray-500">
                Direct community support helps solve problems faster than waiting for bureaucratic queues.
              </p>
              <HelpOfferForm problemId={id} />
            </div>
          )}

          <VerificationPanel
            problemId={id}
            verificationStatus={problemData.verificationStatus}
            verificationCount={verificationCount}
            isAuthor={isAuthor}
          />
        </div>
      </div>
    </div>
  );
}
