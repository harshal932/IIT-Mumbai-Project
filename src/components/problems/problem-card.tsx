"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Users, MessageCircle, Heart, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { UrgencyBadge, StatusBadge, VerificationBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { formatDistanceToNow } from "date-fns";
import type { ProblemPublic } from "@/lib/types";

const urgencyBorderColor: Record<string, string> = {
  low: "border-l-emerald-400",
  medium: "border-l-amber-400",
  high: "border-l-orange-500",
  critical: "border-l-red-600",
};

interface ProblemCardProps {
  problem: ProblemPublic;
  compact?: boolean;
  isSavedInitial?: boolean;
}

export function ProblemCard({ problem, compact = false, isSavedInitial = false }: ProblemCardProps) {
  const border = urgencyBorderColor[problem.urgency] ?? "border-l-gray-300";
  const [isSaved, setIsSaved] = useState(isSavedInitial);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setSaving(true);
    try {
      const res = await fetch(`/api/problems/${problem.id}/follow`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Sign in required", "Please sign in to save problems.");
          return;
        }
        throw new Error(json.error || "Failed to toggle save");
      }

      const following = json.data?.following;
      setIsSaved(following);
      toast.success(
        following ? "Problem saved!" : "Removed from saved",
        following ? "View your saved issues on the /saved page." : undefined
      );
    } catch {
      toast.error("Error", "Could not update saved status.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Link
      href={`/problems/${problem.id}`}
      className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
    >
      <Card
        className={`border-l-4 ${border} hover:shadow-md transition-shadow duration-200 group-hover:border-l-[6px] relative`}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar
                name={problem.isAnonymous ? "Anonymous" : problem.authorDisplayName}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">
                  {problem.isAnonymous ? "Anonymous" : problem.authorDisplayName}
                </p>
                <p className="text-[11px] text-gray-400">
                  {formatDistanceToNow(new Date(problem.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <UrgencyBadge urgency={problem.urgency} />
              <button
                type="button"
                onClick={handleToggleSave}
                disabled={saving}
                aria-label={isSaved ? "Unsave problem" : "Save problem"}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isSaved
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-400"
                    : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600 dark:bg-gray-800 dark:border-gray-700"
                }`}
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {problem.title}
          </h3>

          {/* Description */}
          {!compact && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
              {problem.description}
            </p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <StatusBadge status={problem.status} />
            <VerificationBadge status={problem.verificationStatus} />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="truncate max-w-[160px]">{problem.locationArea}</span>
              </span>
              {problem.affectedCount > 1 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {problem.affectedCount} affected
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1" aria-label={`${problem.commentCount} comments`}>
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {problem.commentCount}
              </span>
              <span className="flex items-center gap-1" aria-label={`${problem.followerCount} followers`}>
                <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                {problem.followerCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
