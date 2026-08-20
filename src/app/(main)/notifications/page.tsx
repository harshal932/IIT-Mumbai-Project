import { db, withDbFallback } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { NotificationList } from "@/components/notifications/notification-list";
import type { NotificationPublic } from "@/lib/types";

const MOCK_NOTIFICATIONS: NotificationPublic[] = [
  {
    id: "notif-1",
    type: "comment",
    title: "New update on streetlight report",
    message: "Sarah Jenkins commented: 'City electric trucks are currently repairing the line on 5th Ave.'",
    data: { problemId: "sample-1" },
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "notif-2",
    type: "help_offer",
    title: "Someone offered assistance!",
    message: "A neighbor offered volunteer help for your pothole report on Main St.",
    data: { problemId: "sample-2" },
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: "notif-3",
    type: "comment",
    title: "Problem verified by 5 community members",
    message: "Your reported issue has reached community_confirmed verification status!",
    data: { problemId: "sample-1" },
    isRead: true,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

export default async function NotificationsPage() {
  const session = await auth();

  let notificationItems: NotificationPublic[] = MOCK_NOTIFICATIONS;

  if (session?.user?.id) {
    const resultRows = await withDbFallback(
      () =>
        db
          .select()
          .from(notifications)
          .where(eq(notifications.userId, session.user.id))
          .orderBy(desc(notifications.createdAt))
          .limit(50),
      []
    );

    if (resultRows.length > 0) {
      notificationItems = resultRows.map((n) => ({
        id: n.id,
        type: n.type as never,
        title: n.title,
        message: n.message,
        data: (n.data ?? {}) as Record<string, unknown>,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      }));
    }
  }

  const unreadCount = notificationItems.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Notifications & Activity
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Stay updated on comments, ground verifications, and direct help offers.
        </p>
      </div>

      <NotificationList initialNotifications={notificationItems} initialUnreadCount={unreadCount} />
    </div>
  );
}
