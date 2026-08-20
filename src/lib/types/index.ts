// ============================================================
// Core Application Types
// ============================================================

export interface RouteContext<T extends string = string> {
  params: Promise<Record<string, string>>;
}

export type UserRole =
  | "citizen"
  | "helper"
  | "moderator"
  | "org_member"
  | "authority"
  | "admin";

export type TrustLevel = "new" | "established" | "trusted" | "expert";

export type ProblemStatus =
  | "open"
  | "receiving_support"
  | "verification_in_progress"
  | "help_matched"
  | "action_in_progress"
  | "awaiting_authority"
  | "partially_solved"
  | "solved_pending_confirmation"
  | "resolved"
  | "closed"
  | "disputed"
  | "archived";

export type ProblemUrgency = "low" | "medium" | "high" | "critical";

export type ProblemType = "public" | "personal";

export type ProblemVisibility =
  | "public"
  | "local"
  | "community"
  | "anonymous_public"
  | "private";

export type HelpType =
  | "information"
  | "advice"
  | "volunteer"
  | "resources"
  | "donation"
  | "professional"
  | "authority_contact"
  | "organization_support";

export type VerificationStatus =
  | "unverified"
  | "evidence_attached"
  | "community_confirmed"
  | "multiple_reports"
  | "org_confirmed"
  | "officially_acknowledged"
  | "resolution_confirmed";

export type OrganizationType =
  | "ngo"
  | "resident_group"
  | "business"
  | "school"
  | "government"
  | "authority"
  | "other";

export type OrganizationVerificationStatus =
  | "pending"
  | "verified"
  | "rejected";

export type OrgMemberRole = "member" | "admin" | "owner";

export type HelpOfferStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed"
  | "cancelled";

export type NotificationType =
  | "comment"
  | "help_offer"
  | "verification_request"
  | "status_change"
  | "organization_response"
  | "nearby_urgent"
  | "matched_help"
  | "moderation_action"
  | "security_event"
  | "follow_update"
  | "reputation_event";

export type ReportReason =
  | "misinformation"
  | "spam"
  | "scam"
  | "harassment"
  | "hate_speech"
  | "violence"
  | "privacy_violation"
  | "off_topic"
  | "duplicate"
  | "other";

export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";

export type ReputationEventType =
  | "helpful_info_confirmed"
  | "genuine_verification"
  | "org_connection"
  | "help_task_completed"
  | "resolution_confirmed"
  | "accurate_moderation_report"
  | "volunteer_action"
  | "problem_resolved"
  | "rollback";

export type ModerationActionType =
  | "hide_content"
  | "restore_content"
  | "restrict_account"
  | "unrestrict_account"
  | "verify_organization"
  | "reject_organization"
  | "award_badge"
  | "revoke_badge"
  | "change_role";

export type ProblemUpdateType =
  | "status_change"
  | "organization_response"
  | "authority_response"
  | "progress_update"
  | "resolution_proposed"
  | "resolution_confirmed"
  | "comment_activity"
  | "help_matched";

// ============================================================
// API Response Types
// ============================================================

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface ApiSuccess<T = unknown> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor?: string;
}

// ============================================================
// Entity Types (as returned by API, not DB row types)
// ============================================================

export interface UserPublic {
  id: string;
  displayName: string;
  image?: string | null;
  trustLevel: TrustLevel;
  reputationScore: number;
  createdAt: string;
  badges?: BadgePublic[];
}

export interface ProfilePublic {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  locationArea: string | null;
  website: string | null;
  reputationScore: number;
  trustLevel: TrustLevel;
  problemsPosted: number;
  helpActionsCompleted: number;
  solvedProblems: number;
  skills: string[];
  languages: { language: string; proficiency: string }[];
  badges: BadgePublic[];
  createdAt: string;
}

export interface ProblemPublic {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  urgency: ProblemUrgency;
  problemType: ProblemType;
  helpTypes: HelpType[];
  authorId: string;
  authorDisplayName: string;
  isAnonymous: boolean;
  latitude: number;
  longitude: number;
  locationArea: string;
  affectedCount: number;
  startedAt: string | null;
  visibility: ProblemVisibility;
  status: ProblemStatus;
  verificationStatus: VerificationStatus;
  viewCount: number;
  followerCount: number;
  commentCount: number;
  media: ProblemMediaPublic[];
  createdAt: string;
  updatedAt: string;
}

export interface ProblemMediaPublic {
  id: string;
  mediaType: "image" | "video";
  url: string; // signed URL
  thumbnailUrl?: string;
}

export interface CommentPublic {
  id: string;
  problemId: string;
  authorId: string;
  authorDisplayName: string;
  authorImage?: string | null;
  content: string;
  isHelpful: boolean;
  editedAt: string | null;
  createdAt: string;
}

export interface HelpOfferPublic {
  id: string;
  problemId: string;
  helperId: string;
  helperDisplayName: string;
  helpTypes: HelpType[];
  message: string;
  status: HelpOfferStatus;
  createdAt: string;
}

export interface OrganizationPublic {
  id: string;
  name: string;
  type: OrganizationType;
  description: string;
  website: string | null;
  serviceArea: string | null;
  verificationStatus: OrganizationVerificationStatus;
  logoUrl: string | null;
  memberCount?: number;
  createdAt: string;
}

export interface NotificationPublic {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface BadgePublic {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  awardedAt?: string;
}

export interface AuditLogPublic {
  id: string;
  actorId: string;
  actorDisplayName?: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ReputationEventPublic {
  id: string;
  eventType: ReputationEventType;
  points: number;
  referenceId: string | null;
  referenceType: string | null;
  createdAt: string;
}

export interface StatusTimelineEvent {
  id: string;
  actorId: string;
  actorDisplayName: string;
  actorRole: UserRole;
  updateType: ProblemUpdateType;
  previousStatus: ProblemStatus | null;
  newStatus: ProblemStatus | null;
  message: string | null;
  createdAt: string;
}

// ============================================================
// Form / Action Types
// ============================================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export interface ProblemFilters {
  category?: string;
  urgency?: ProblemUrgency;
  status?: ProblemStatus;
  helpType?: HelpType;
  verificationStatus?: VerificationStatus;
  distance?: number;
  lat?: number;
  lng?: number;
  search?: string;
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// ============================================================
// Permission Types
// ============================================================

export type Permission =
  | "problems:create"
  | "problems:read"
  | "problems:update:own"
  | "problems:update:any"
  | "problems:delete:own"
  | "problems:delete:any"
  | "problems:change_status"
  | "comments:create"
  | "comments:read"
  | "comments:delete:own"
  | "comments:delete:any"
  | "help_offers:create"
  | "help_offers:accept"
  | "verifications:create"
  | "organizations:create"
  | "organizations:manage:own"
  | "organizations:verify"
  | "reports:create"
  | "reports:review"
  | "users:read:public"
  | "users:read:private"
  | "users:restrict"
  | "admin:access"
  | "admin:roles"
  | "admin:audit";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  citizen: [
    "problems:create",
    "problems:read",
    "problems:update:own",
    "problems:delete:own",
    "comments:create",
    "comments:read",
    "comments:delete:own",
    "help_offers:create",
    "verifications:create",
    "organizations:create",
    "reports:create",
    "users:read:public",
  ],
  helper: [
    "problems:create",
    "problems:read",
    "problems:update:own",
    "problems:delete:own",
    "comments:create",
    "comments:read",
    "comments:delete:own",
    "help_offers:create",
    "help_offers:accept",
    "verifications:create",
    "organizations:create",
    "reports:create",
    "users:read:public",
  ],
  org_member: [
    "problems:create",
    "problems:read",
    "problems:update:own",
    "problems:delete:own",
    "problems:change_status",
    "comments:create",
    "comments:read",
    "comments:delete:own",
    "help_offers:create",
    "verifications:create",
    "organizations:create",
    "organizations:manage:own",
    "reports:create",
    "users:read:public",
  ],
  authority: [
    "problems:create",
    "problems:read",
    "problems:update:own",
    "problems:delete:own",
    "problems:change_status",
    "comments:create",
    "comments:read",
    "comments:delete:own",
    "help_offers:create",
    "verifications:create",
    "organizations:create",
    "organizations:manage:own",
    "reports:create",
    "users:read:public",
  ],
  moderator: [
    "problems:create",
    "problems:read",
    "problems:update:own",
    "problems:update:any",
    "problems:delete:own",
    "problems:delete:any",
    "comments:create",
    "comments:read",
    "comments:delete:own",
    "comments:delete:any",
    "help_offers:create",
    "verifications:create",
    "reports:create",
    "reports:review",
    "users:read:public",
    "users:read:private",
    "users:restrict",
  ],
  admin: [
    "problems:create",
    "problems:read",
    "problems:update:own",
    "problems:update:any",
    "problems:delete:own",
    "problems:delete:any",
    "problems:change_status",
    "comments:create",
    "comments:read",
    "comments:delete:own",
    "comments:delete:any",
    "help_offers:create",
    "help_offers:accept",
    "verifications:create",
    "organizations:create",
    "organizations:manage:own",
    "organizations:verify",
    "reports:create",
    "reports:review",
    "users:read:public",
    "users:read:private",
    "users:restrict",
    "admin:access",
    "admin:roles",
    "admin:audit",
  ],
};

export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
