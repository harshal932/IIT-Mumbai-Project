"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

interface NotificationBellProps {
  hasUnread?: boolean;
}

export function NotificationBell({ hasUnread = false }: NotificationBellProps) {
  return (
    <Link
      href="/notifications"
      className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {hasUnread && (
        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-gray-900 animate-pulse" />
      )}
    </Link>
  );
}
