import { auth } from "@/auth";
import { ForbiddenError, AuthError } from "@/lib/utils/errors";
import type { UserRole, Permission } from "@/lib/types";
import { hasPermission } from "@/lib/types";
import { cache } from "react";

/**
 * Get the current session — memoized per request using React cache().
 */
export const getCachedSession = cache(async () => {
  try {
    return await auth();
  } catch (err) {
    console.warn("[getCachedSession] Session lookup fallback:", err);
    return null;
  }
});

/**
 * Get the current session — throws AuthError if not authenticated.
 */
export async function requireAuth() {
  const session = await getCachedSession();
  if (!session?.user?.id) throw new AuthError();
  return session;
}

/**
 * Get the current session — returns null if not authenticated.
 */
export async function getOptionalSession() {
  return getCachedSession();
}

/**
 * Require a specific permission, throwing ForbiddenError if missing.
 */
export async function requirePermission(permission: Permission) {
  const session = await requireAuth();
  const role = session.user.role ?? "citizen";
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError();
  }
  return session;
}

/**
 * Require one of several acceptable roles.
 */
export async function requireRole(...roles: UserRole[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) {
    throw new ForbiddenError();
  }
  return session;
}

/**
 * Check if the current user owns a resource, or has an override role.
 * Throws ForbiddenError if neither.
 */
export async function requireOwnerOrRole(
  resourceOwnerId: string,
  ...allowedRoles: UserRole[]
) {
  const session = await requireAuth();
  const userId = session.user.id;
  const role = session.user.role;

  if (userId === resourceOwnerId) return session;
  if (allowedRoles.includes(role)) return session;

  throw new ForbiddenError();
}
