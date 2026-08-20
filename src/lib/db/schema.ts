import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  numeric,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// AUTH.JS REQUIRED TABLES
// ============================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"),
    email: text("email").unique().notNull(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    // Extended fields
    passwordHash: text("password_hash"),
    primaryRole: text("primary_role").default("citizen").notNull(),
    isAnonymous: boolean("is_anonymous").default(false).notNull(),
    isRestricted: boolean("is_restricted").default(false).notNull(),
    restrictionReason: text("restriction_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("users_email_idx").on(t.email),
    index("users_role_idx").on(t.primaryRole),
    index("users_created_at_idx").on(t.createdAt),
  ]
);

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("accounts_user_id_idx").on(t.userId),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)]
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// ============================================================
// PROFILES
// ============================================================

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    displayName: text("display_name"),
    bio: text("bio"),
    locationArea: text("location_area"),
    website: text("website"),
    reputationScore: integer("reputation_score").default(0).notNull(),
    trustLevel: text("trust_level").default("new").notNull(),
    problemsPosted: integer("problems_posted").default(0).notNull(),
    helpActionsCompleted: integer("help_actions_completed").default(0).notNull(),
    solvedProblems: integer("solved_problems").default(0).notNull(),
    // Location preferences (approximate, never exact)
    preferredLat: numeric("preferred_lat", { precision: 9, scale: 6 }),
    preferredLon: numeric("preferred_lon", { precision: 9, scale: 6 }),
    notificationRadius: integer("notification_radius").default(10), // km
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("profiles_user_id_unique_idx").on(t.userId),
    index("profiles_reputation_idx").on(t.reputationScore),
    index("profiles_trust_level_idx").on(t.trustLevel),
  ]
);

export const userSkills = pgTable(
  "user_skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    skill: text("skill").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("user_skills_user_id_idx").on(t.userId),
    uniqueIndex("user_skills_unique_idx").on(t.userId, t.skill),
  ]
);

export const userLanguages = pgTable(
  "user_languages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    language: text("language").notNull(),
    proficiency: text("proficiency").default("conversational").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("user_languages_user_id_idx").on(t.userId),
    uniqueIndex("user_languages_unique_idx").on(t.userId, t.language),
  ]
);

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").notNull(),
    grantedBy: uuid("granted_by").references(() => users.id),
    grantedAt: timestamp("granted_at").defaultNow().notNull(),
    revokedAt: timestamp("revoked_at"),
  },
  (t) => [
    index("user_roles_user_id_idx").on(t.userId),
    uniqueIndex("user_roles_unique_idx").on(t.userId, t.role),
  ]
);

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  pushNotifications: boolean("push_notifications").default(false).notNull(),
  nearbyAlerts: boolean("nearby_alerts").default(false).notNull(),
  categoryAlerts: text("category_alerts").array().default([]).notNull(),
  quietHoursStart: text("quiet_hours_start"),
  quietHoursEnd: text("quiet_hours_end"),
  showSensitiveContent: boolean("show_sensitive_content").default(false).notNull(),
  defaultVisibility: text("default_visibility").default("public").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================
// CATEGORIES
// ============================================================

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    parentId: uuid("parent_id"),
    icon: text("icon").default("circle").notNull(),
    color: text("color").default("#6366f1").notNull(),
    isSensitive: boolean("is_sensitive").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("categories_slug_unique_idx").on(t.slug),
    index("categories_parent_idx").on(t.parentId),
  ]
);

// ============================================================
// ORGANIZATIONS
// ============================================================

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(), // ngo, resident_group, business, school, government, authority
    description: text("description").notNull(),
    contactMethod: text("contact_method"),
    website: text("website"),
    serviceArea: text("service_area"),
    verificationStatus: text("verification_status").default("pending").notNull(),
    verifiedBy: uuid("verified_by").references(() => users.id),
    verifiedAt: timestamp("verified_at"),
    createdBy: uuid("created_by")
      .references(() => users.id)
      .notNull(),
    logoUrl: text("logo_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("orgs_status_idx").on(t.verificationStatus),
    index("orgs_type_idx").on(t.type),
    index("orgs_created_by_idx").on(t.createdBy),
  ]
);

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").default("member").notNull(), // member, admin, owner
    addedBy: uuid("added_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    removedAt: timestamp("removed_at"),
  },
  (t) => [
    index("org_members_org_id_idx").on(t.organizationId),
    index("org_members_user_id_idx").on(t.userId),
    uniqueIndex("org_members_unique_idx").on(t.organizationId, t.userId),
  ]
);

// ============================================================
// PROBLEMS
// ============================================================

export const problems = pgTable(
  "problems",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    categoryId: uuid("category_id").references(() => categories.id),
    urgency: text("urgency").default("medium").notNull(),
    problemType: text("problem_type").default("public").notNull(),
    helpTypes: text("help_types").array().default([]).notNull(),
    authorId: uuid("author_id")
      .references(() => users.id)
      .notNull(),
    // Public approximate location (always shown)
    latitude: numeric("latitude", { precision: 9, scale: 6 }).notNull(),
    longitude: numeric("longitude", { precision: 9, scale: 6 }).notNull(),
    locationArea: text("location_area").notNull(),
    // Private exact location (only stored when user consents & necessary)
    exactLatitude: numeric("exact_latitude", { precision: 9, scale: 6 }),
    exactLongitude: numeric("exact_longitude", { precision: 9, scale: 6 }),
    isAnonymous: boolean("is_anonymous").default(false).notNull(),
    affectedCount: integer("affected_count").default(1).notNull(),
    startedAt: timestamp("started_at"),
    visibility: text("visibility").default("public").notNull(),
    status: text("status").default("open").notNull(),
    verificationStatus: text("verification_status").default("unverified").notNull(),
    consentGiven: boolean("consent_given").default(false).notNull(),
    isSensitive: boolean("is_sensitive").default(false).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    followerCount: integer("follower_count").default(0).notNull(),
    commentCount: integer("comment_count").default(0).notNull(),
    helpOfferCount: integer("help_offer_count").default(0).notNull(),
    verificationCount: integer("verification_count").default(0).notNull(),
    // Visibility ranking score (server-computed, never client-trusted)
    rankingScore: integer("ranking_score").default(0).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedBy: uuid("deleted_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("problems_author_id_idx").on(t.authorId),
    index("problems_status_idx").on(t.status),
    index("problems_urgency_idx").on(t.urgency),
    index("problems_category_idx").on(t.categoryId),
    index("problems_visibility_idx").on(t.visibility),
    index("problems_created_at_idx").on(t.createdAt),
    index("problems_ranking_idx").on(t.rankingScore),
    index("problems_location_idx").on(t.latitude, t.longitude),
    index("problems_deleted_idx").on(t.isDeleted),
  ]
);

export const problemMedia = pgTable(
  "problem_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    problemId: uuid("problem_id")
      .references(() => problems.id, { onDelete: "cascade" })
      .notNull(),
    uploaderId: uuid("uploader_id")
      .references(() => users.id)
      .notNull(),
    mediaType: text("media_type").notNull(), // image, video
    fileKey: text("file_key").notNull(), // storage key (never predictable)
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    thumbnailKey: text("thumbnail_key"),
    isPublic: boolean("is_public").default(false).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("problem_media_problem_id_idx").on(t.problemId),
    index("problem_media_uploader_idx").on(t.uploaderId),
  ]
);

export const problemUpdates = pgTable(
  "problem_updates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    problemId: uuid("problem_id")
      .references(() => problems.id, { onDelete: "cascade" })
      .notNull(),
    actorId: uuid("actor_id").references(() => users.id).notNull(),
    actorRole: text("actor_role").notNull(),
    updateType: text("update_type").notNull(),
    previousStatus: text("previous_status"),
    newStatus: text("new_status"),
    message: text("message"),
    organizationId: uuid("organization_id").references(() => organizations.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("problem_updates_problem_id_idx").on(t.problemId),
    index("problem_updates_actor_idx").on(t.actorId),
    index("problem_updates_created_at_idx").on(t.createdAt),
  ]
);

// ============================================================
// COMMENTS
// ============================================================

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    problemId: uuid("problem_id")
      .references(() => problems.id, { onDelete: "cascade" })
      .notNull(),
    authorId: uuid("author_id")
      .references(() => users.id)
      .notNull(),
    content: text("content").notNull(),
    isHelpful: boolean("is_helpful").default(false).notNull(),
    helpfulMarkedBy: uuid("helpful_marked_by").references(() => users.id),
    helpfulMarkedAt: timestamp("helpful_marked_at"),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedBy: uuid("deleted_by").references(() => users.id),
    editedAt: timestamp("edited_at"),
    reportCount: integer("report_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("comments_problem_id_idx").on(t.problemId),
    index("comments_author_id_idx").on(t.authorId),
    index("comments_created_at_idx").on(t.createdAt),
    index("comments_deleted_idx").on(t.isDeleted),
  ]
);

// ============================================================
// FOLLOWS
// ============================================================

export const follows = pgTable(
  "follows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    problemId: uuid("problem_id")
      .references(() => problems.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("follows_unique_idx").on(t.userId, t.problemId),
    index("follows_user_id_idx").on(t.userId),
    index("follows_problem_id_idx").on(t.problemId),
  ]
);

// ============================================================
// HELP OFFERS
// ============================================================

export const helpOffers = pgTable(
  "help_offers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    problemId: uuid("problem_id")
      .references(() => problems.id, { onDelete: "cascade" })
      .notNull(),
    helperId: uuid("helper_id")
      .references(() => users.id)
      .notNull(),
    helpTypes: text("help_types").array().default([]).notNull(),
    message: text("message").notNull(),
    status: text("status").default("pending").notNull(),
    isPrivate: boolean("is_private").default(true).notNull(),
    respondedAt: timestamp("responded_at"),
    completedAt: timestamp("completed_at"),
    wasHelpful: boolean("was_helpful"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("help_offers_problem_id_idx").on(t.problemId),
    index("help_offers_helper_id_idx").on(t.helperId),
    index("help_offers_status_idx").on(t.status),
    uniqueIndex("help_offers_unique_idx").on(t.problemId, t.helperId),
  ]
);

// ============================================================
// VERIFICATIONS
// ============================================================

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    problemId: uuid("problem_id")
      .references(() => problems.id, { onDelete: "cascade" })
      .notNull(),
    verifierId: uuid("verifier_id")
      .references(() => users.id)
      .notNull(),
    verificationType: text("verification_type").notNull(), // confirm, dispute, evidence
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("verifications_problem_id_idx").on(t.problemId),
    uniqueIndex("verifications_unique_idx").on(t.problemId, t.verifierId),
  ]
);

// ============================================================
// AUTHORITY RESPONSES
// ============================================================

export const authorityResponses = pgTable(
  "authority_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    problemId: uuid("problem_id")
      .references(() => problems.id, { onDelete: "cascade" })
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    responderId: uuid("responder_id")
      .references(() => users.id)
      .notNull(),
    responseType: text("response_type").notNull(), // acknowledgment, progress_update, resolution_proposal
    message: text("message").notNull(),
    officialReference: text("official_reference"),
    isPublic: boolean("is_public").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("auth_responses_problem_id_idx").on(t.problemId),
    index("auth_responses_org_id_idx").on(t.organizationId),
  ]
);

// ============================================================
// REPUTATION
// ============================================================

export const reputationEvents = pgTable(
  "reputation_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    eventType: text("event_type").notNull(),
    points: integer("points").notNull(),
    referenceId: uuid("reference_id"),
    referenceType: text("reference_type"),
    isRolledBack: boolean("is_rolled_back").default(false).notNull(),
    rolledBackAt: timestamp("rolled_back_at"),
    rolledBackBy: uuid("rolled_back_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("rep_events_user_id_idx").on(t.userId),
    index("rep_events_type_idx").on(t.eventType),
    index("rep_events_created_at_idx").on(t.createdAt),
    index("rep_events_ref_idx").on(t.referenceId, t.referenceType),
  ]
);

// ============================================================
// BADGES
// ============================================================

export const badges = pgTable(
  "badges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    icon: text("icon").notNull(),
    requirement: text("requirement").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("badges_slug_unique_idx").on(t.slug)]
);

export const userBadges = pgTable(
  "user_badges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    badgeId: uuid("badge_id")
      .references(() => badges.id)
      .notNull(),
    awardedBy: uuid("awarded_by").references(() => users.id),
    awardedAt: timestamp("awarded_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("user_badges_unique_idx").on(t.userId, t.badgeId),
    index("user_badges_user_id_idx").on(t.userId),
  ]
);

// ============================================================
// REPORTS & MODERATION
// ============================================================

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reporterId: uuid("reporter_id")
      .references(() => users.id)
      .notNull(),
    contentType: text("content_type").notNull(), // problem, comment, user
    contentId: uuid("content_id").notNull(),
    reason: text("reason").notNull(),
    description: text("description"),
    status: text("status").default("pending").notNull(),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    resolution: text("resolution"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("reports_content_idx").on(t.contentType, t.contentId),
    index("reports_status_idx").on(t.status),
    index("reports_reporter_idx").on(t.reporterId),
    index("reports_created_at_idx").on(t.createdAt),
  ]
);

export const moderationActions = pgTable(
  "moderation_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    moderatorId: uuid("moderator_id")
      .references(() => users.id)
      .notNull(),
    actionType: text("action_type").notNull(),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    reason: text("reason").notNull(),
    reportId: uuid("report_id").references(() => reports.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("mod_actions_moderator_idx").on(t.moderatorId),
    index("mod_actions_target_idx").on(t.targetType, t.targetId),
    index("mod_actions_created_at_idx").on(t.createdAt),
  ]
);

// ============================================================
// BLOCKS & MUTES
// ============================================================

export const userBlocks = pgTable(
  "user_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    blockerId: uuid("blocker_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    blockedId: uuid("blocked_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("user_blocks_unique_idx").on(t.blockerId, t.blockedId),
    index("user_blocks_blocker_idx").on(t.blockerId),
  ]
);

// ============================================================
// NOTIFICATIONS
// ============================================================

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    data: jsonb("data").default({}).notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("notifications_user_id_idx").on(t.userId),
    index("notifications_is_read_idx").on(t.isRead),
    index("notifications_created_at_idx").on(t.createdAt),
  ]
);

// ============================================================
// AUDIT LOGS
// ============================================================

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id),
    actorRole: text("actor_role"),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    ipAddress: text("ip_address"), // hashed, not raw
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("audit_logs_actor_idx").on(t.actorId),
    index("audit_logs_action_idx").on(t.action),
    index("audit_logs_target_idx").on(t.targetType, t.targetId),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ]
);

// ============================================================
// RELATIONS
// ============================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  accounts: many(accounts),
  sessions: many(sessions),
  roles: many(userRoles),
  skills: many(userSkills),
  languages: many(userLanguages),
  problems: many(problems),
  comments: many(comments),
  follows: many(follows),
  helpOffers: many(helpOffers),
  badges: many(userBadges),
  notifications: many(notifications),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export const problemsRelations = relations(problems, ({ one, many }) => ({
  author: one(users, { fields: [problems.authorId], references: [users.id] }),
  category: one(categories, {
    fields: [problems.categoryId],
    references: [categories.id],
  }),
  media: many(problemMedia),
  comments: many(comments),
  follows: many(follows),
  helpOffers: many(helpOffers),
  verifications: many(verifications),
  updates: many(problemUpdates),
  authorityResponses: many(authorityResponses),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  problem: one(problems, {
    fields: [comments.problemId],
    references: [problems.id],
  }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [organizations.createdBy],
      references: [users.id],
    }),
    members: many(organizationMembers),
    authorityResponses: many(authorityResponses),
  })
);
