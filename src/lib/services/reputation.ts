import { db } from "@/lib/db";
import {
  reputationEvents,
  profiles,
  userBadges,
  badges,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { ReputationEventType, UserRole } from "@/lib/types";
import { logError } from "@/lib/utils/errors";

// Points per event type
const REPUTATION_POINTS: Record<ReputationEventType, number> = {
  helpful_info_confirmed: 10,
  genuine_verification: 5,
  org_connection: 8,
  help_task_completed: 15,
  resolution_confirmed: 20,
  accurate_moderation_report: 8,
  volunteer_action: 12,
  problem_resolved: 25,
  rollback: 0, // handled specially
};

// Trust level thresholds
const TRUST_THRESHOLDS = {
  new: 0,
  established: 50,
  trusted: 200,
  expert: 500,
};

function computeTrustLevel(score: number): string {
  if (score >= TRUST_THRESHOLDS.expert) return "expert";
  if (score >= TRUST_THRESHOLDS.trusted) return "trusted";
  if (score >= TRUST_THRESHOLDS.established) return "established";
  return "new";
}

/**
 * Award reputation points to a user for a specific event.
 * Anti-gaming: prevents duplicate events for the same reference.
 */
export async function awardReputation(options: {
  userId: string;
  eventType: ReputationEventType;
  referenceId?: string;
  referenceType?: string;
  actorId?: string; // who triggered the event
}): Promise<void> {
  const { userId, eventType, referenceId, referenceType } = options;

  // Self-award prevention — actor cannot award themselves
  if (options.actorId && options.actorId === userId) {
    return;
  }

  try {
    await db.transaction(async (tx) => {
      // Duplicate prevention — only one event per (user, type, reference)
      if (referenceId && referenceType) {
        const existing = await tx
          .select({ id: reputationEvents.id })
          .from(reputationEvents)
          .where(
            and(
              eq(reputationEvents.userId, userId),
              eq(reputationEvents.eventType, eventType),
              eq(reputationEvents.referenceId, referenceId),
              eq(reputationEvents.referenceType, referenceType),
              eq(reputationEvents.isRolledBack, false)
            )
          )
          .limit(1);

        if (existing.length > 0) return; // already awarded
      }

      const points = REPUTATION_POINTS[eventType] ?? 0;

      await tx.insert(reputationEvents).values({
        userId,
        eventType,
        points,
        referenceId: referenceId ?? null,
        referenceType: referenceType ?? null,
      });

      // Update profile score and trust level
      const [updated] = await tx
        .update(profiles)
        .set({
          reputationScore: sql`${profiles.reputationScore} + ${points}`,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, userId))
        .returning({ score: profiles.reputationScore });

      if (updated) {
        const newTrust = computeTrustLevel(updated.score);
        await tx
          .update(profiles)
          .set({ trustLevel: newTrust })
          .where(eq(profiles.userId, userId));
      }
    });
  } catch (err) {
    logError("Reputation.awardReputation", err, { userId, eventType });
  }
}

/**
 * Roll back reputation — used when abuse is confirmed.
 */
export async function rollbackReputation(
  eventId: string,
  adminId: string
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      const [event] = await tx
        .select()
        .from(reputationEvents)
        .where(
          and(
            eq(reputationEvents.id, eventId),
            eq(reputationEvents.isRolledBack, false)
          )
        )
        .limit(1);

      if (!event) return;

      await tx
        .update(reputationEvents)
        .set({
          isRolledBack: true,
          rolledBackAt: new Date(),
          rolledBackBy: adminId,
        })
        .where(eq(reputationEvents.id, eventId));

      // Deduct the points
      await tx
        .update(profiles)
        .set({
          reputationScore: sql`GREATEST(0, ${profiles.reputationScore} - ${event.points})`,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, event.userId));
    });
  } catch (err) {
    logError("Reputation.rollback", err, { eventId });
  }
}

/**
 * Get reputation history for a user.
 */
export async function getReputationHistory(userId: string) {
  return db
    .select()
    .from(reputationEvents)
    .where(eq(reputationEvents.userId, userId))
    .orderBy(reputationEvents.createdAt)
    .limit(100);
}
