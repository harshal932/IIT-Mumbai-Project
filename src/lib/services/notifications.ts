import { db } from "@/lib/db";
import { notifications, users, userPreferences } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import type { NotificationType } from "@/lib/types";
import { logError } from "@/lib/utils/errors";
import { sendNotificationEmail } from "./email";

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Create an in-app notification for a user and trigger an email notification.
 * Never throws — notification failures must not interrupt business logic.
 */
export async function createNotification(
  options: CreateNotificationOptions
): Promise<void> {
  try {
    // Insert in-app notification
    await db.insert(notifications).values({
      userId: options.userId,
      type: options.type,
      title: options.title,
      message: options.message,
      data: options.data ?? {},
      isRead: false,
    });

    // Check user email & preferences for email notifications
    try {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, options.userId))
        .limit(1);

      if (user?.email) {
        const actionUrl = options.data?.problemId
          ? `${process.env.AUTH_URL || "http://localhost:3000"}/problems/${options.data.problemId}`
          : undefined;

        sendNotificationEmail({
          to: user.email,
          title: options.title,
          message: options.message,
          actionUrl,
        }).catch(() => {});
      }
    } catch {
      // Ignore preference lookup errors
    }
  } catch (err) {
    logError("Notifications.create", err, { userId: options.userId });
  }
}

/**
 * Notify all followers of a problem about an update (in-app + email).
 */
export async function notifyFollowers(
  followerIds: string[],
  options: Omit<CreateNotificationOptions, "userId">
): Promise<void> {
  if (followerIds.length === 0) return;

  const inserts = followerIds.map((userId) => ({
    userId,
    type: options.type,
    title: options.title,
    message: options.message,
    data: options.data ?? {},
    isRead: false as const,
  }));

  try {
    // Batch insert notifications
    await db.insert(notifications).values(inserts);

    // Fetch user emails to send notification emails
    try {
      const userRows = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(inArray(users.id, followerIds));

      const actionUrl = options.data?.problemId
        ? `${process.env.AUTH_URL || "http://localhost:3000"}/problems/${options.data.problemId}`
        : undefined;

      for (const u of userRows) {
        if (u.email) {
          sendNotificationEmail({
            to: u.email,
            title: options.title,
            message: options.message,
            actionUrl,
          }).catch(() => {});
        }
      }
    } catch {
      // Ignore email errors
    }
  } catch (err) {
    logError("Notifications.notifyFollowers", err);
  }
}

/**
 * Get unread notifications for a user.
 */
export async function getUserNotifications(
  userId: string,
  options: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}
) {
  const { page = 1, pageSize = 30 } = options;
  const offset = (page - 1) * pageSize;

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(notifications.createdAt)
    .limit(pageSize)
    .offset(offset);
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(
  notificationId: string,
  _userId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}
