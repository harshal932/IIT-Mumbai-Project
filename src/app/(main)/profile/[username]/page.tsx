import { db, withDbFallback } from "@/lib/db";
import { users, profiles, userBadges, badges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Award } from "lucide-react";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

const MOCK_PROFILE = {
  displayName: "Community Member",
  trustLevel: "established",
  primaryRole: "citizen",
  bio: "Active local resident dedicated to street safety and neighborhood improvements.",
  reputationScore: 85,
  problemsPosted: 4,
  helpActionsCompleted: 6,
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const decodedEmail = decodeURIComponent(username);

  let profileData = {
    displayName: decodedEmail.split("@")[0] || MOCK_PROFILE.displayName,
    trustLevel: MOCK_PROFILE.trustLevel,
    primaryRole: MOCK_PROFILE.primaryRole,
    bio: MOCK_PROFILE.bio,
    reputationScore: MOCK_PROFILE.reputationScore,
    problemsPosted: MOCK_PROFILE.problemsPosted,
    helpActionsCompleted: MOCK_PROFILE.helpActionsCompleted,
    image: null as string | null,
  };

  const [dbRows, userBadgeRows] = await withDbFallback(
    () =>
      Promise.all([
        db
          .select({
            user: users,
            profile: profiles,
          })
          .from(users)
          .leftJoin(profiles, eq(profiles.userId, users.id))
          .where(eq(users.email, decodedEmail))
          .limit(1),
        db
          .select({ badge: badges, awardedAt: userBadges.awardedAt })
          .from(userBadges)
          .leftJoin(badges, eq(badges.id, userBadges.badgeId))
          .leftJoin(users, eq(users.id, userBadges.userId))
          .where(eq(users.email, decodedEmail)),
      ]),
    [[], []]
  );

  if (dbRows.length > 0) {
    const { user, profile } = dbRows[0];
    profileData = {
      displayName: profile?.displayName || user.name || user.email.split("@")[0],
      trustLevel: profile?.trustLevel || "new",
      primaryRole: user.primaryRole || "citizen",
      bio: profile?.bio || MOCK_PROFILE.bio,
      reputationScore: profile?.reputationScore || 0,
      problemsPosted: profile?.problemsPosted || 0,
      helpActionsCompleted: profile?.helpActionsCompleted || 0,
      image: user.image,
    };
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <Avatar src={profileData.image} name={profileData.displayName} size="xl" />
          <div className="flex-1 space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {profileData.displayName}
            </h1>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
              <Badge variant="default">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                Trust Level: {profileData.trustLevel}
              </Badge>
              <Badge variant="neutral">
                Role: {profileData.primaryRole}
              </Badge>
            </div>
            {profileData.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-300 pt-2">
                {profileData.bio}
              </p>
            )}
          </div>
        </div>

        {/* Reputation & Action Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
            <span className="block text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {profileData.reputationScore}
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Reputation Points
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
            <span className="block text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {profileData.problemsPosted}
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Problems Reported
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
            <span className="block text-2xl font-extrabold text-purple-600 dark:text-purple-400">
              {profileData.helpActionsCompleted}
            </span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Help Completed
            </span>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-2xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-500" />
          Community Badges
        </h3>

        {userBadgeRows.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No badges earned yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userBadgeRows.map(({ badge }) => (
              <div
                key={badge!.id}
                className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/30"
              >
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {badge!.name}
                  </h4>
                  <p className="text-[11px] text-gray-500">{badge!.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
