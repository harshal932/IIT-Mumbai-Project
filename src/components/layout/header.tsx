import Link from "next/link";
import { auth } from "@/auth";
import { NotificationBell } from "@/components/layout/notification-bell";
import { SearchBar } from "@/components/layout/search-bar";
import { UserNav } from "@/components/layout/user-nav";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function Header() {
  const session = await auth();
  let hasUnread = false;

  if (session?.user) {
    try {
      const [row] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, session.user.id),
            eq(notifications.isRead, false)
          )
        );
      hasUnread = Number(row?.count || 0) > 0;
    } catch {
      hasUnread = true; // Fallback to indicator dot in dev
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm px-4 dark:border-gray-700 dark:bg-gray-900/95">
      {/* Logo */}
      <Link
        href={session ? "/feed" : "/"}
        className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400 text-lg shrink-0"
        aria-label="LocalLoop — home"
      >
        <svg
          className="h-7 w-7"
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="16" cy="16" r="14" fill="currentColor" opacity="0.15" />
          <circle cx="16" cy="16" r="8" fill="currentColor" opacity="0.3" />
          <circle cx="16" cy="16" r="4" fill="currentColor" />
          <path
            d="M16 4 C16 4 28 12 28 20 C28 26 22 30 16 30 C10 30 4 26 4 20 C4 12 16 4 16 4Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            opacity="0.4"
          />
        </svg>
        <span>LocalLoop</span>
      </Link>

      {/* Search */}
      <SearchBar />

      <div className="flex items-center gap-3 ml-auto">
        {session?.user ? (
          <>
            {/* Notifications Bell */}
            <NotificationBell hasUnread={hasUnread} />

            {/* Profile Dropdown with Logout Option */}
            <UserNav user={session.user} />
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Join
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
