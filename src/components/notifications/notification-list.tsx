"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCheck,
  MessageSquare,
  HandHeart,
  ShieldCheck,
  RefreshCw,
  Award,
  AlertCircle,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { NotificationPublic, NotificationType } from "@/lib/types";

const typeIcons: Record<NotificationType | string, React.ElementType> = {
  comment: MessageSquare,
  help_offer: HandHeart,
  verification_request: ShieldCheck,
  status_change: RefreshCw,
  reputation_event: Award,
  follow_update: Bell,
  organization_response: RefreshCw,
  nearby_urgent: AlertCircle,
  moderation_action: AlertCircle,
  security_event: AlertCircle,
  matched_help: HandHeart,
};

const typeColors: Record<NotificationType | string, string> = {
  comment: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  help_offer: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  verification_request: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
  status_change: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
  reputation_event: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  follow_update: "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400",
};

interface NotificationListProps {
  initialNotifications: NotificationPublic[];
  initialUnreadCount: number;
}

export function NotificationList({
  initialNotifications,
  initialUnreadCount,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<NotificationPublic[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [filter, setFilter] = useState<"all" | "unread" | "comments" | "help">("all");
  const [markingAll, setMarkingAll] = useState(false);
  const toast = useToast();

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Could not update notifications");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleItemClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const filteredItems = notifications.filter((item) => {
    if (filter === "unread") return !item.isRead;
    if (filter === "comments") return item.type === "comment";
    if (filter === "help") return item.type === "help_offer";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header Bar with Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            All ({notifications.length})
          </button>

          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filter === "unread"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-400 text-white text-[10px]">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter("comments")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "comments"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Comments
          </button>

          <button
            onClick={() => setFilter("help")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "help"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            Help Offers
          </button>
        </div>

        {/* Mark all read button */}
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            loading={markingAll}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <CheckCheck className="h-4 w-4 mr-1.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 shadow-2xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-2">
            <Bell className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              No notifications found in this view
            </p>
            <p className="text-xs text-gray-400">
              When community members respond to your posts or updates occur, they will appear here.
            </p>
          </div>
        ) : (
          filteredItems.map((n) => {
            const Icon = typeIcons[n.type] || Bell;
            const colorClass = typeColors[n.type] || "bg-gray-100 text-gray-600";
            const problemId = (n.data as { problemId?: string })?.problemId;
            const targetHref = problemId ? `/problems/${problemId}` : "#";

            return (
              <Link
                key={n.id}
                href={targetHref}
                onClick={() => handleItemClick(n.id, n.isRead)}
                className={`flex items-start gap-3.5 p-4 transition-colors group relative ${
                  !n.isRead
                    ? "bg-indigo-50/50 hover:bg-indigo-50/80 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                }`}
              >
                {/* Unread indicator dot */}
                {!n.isRead && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}

                <div className={`p-2.5 rounded-xl shrink-0 ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h4 className={`text-sm font-semibold truncate ${
                      !n.isRead ? "text-indigo-950 dark:text-indigo-100" : "text-gray-900 dark:text-gray-100"
                    }`}>
                      {n.title}
                    </h4>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                    {n.message}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 shrink-0 self-center transition-colors" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
