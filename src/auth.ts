import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcryptjs from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/index";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  profiles,
  userPreferences,
} from "@/lib/db/schema";
import type { UserRole } from "@/lib/types";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
    verifyRequest: "/login?verify=1",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (user && user.passwordHash) {
            if (user.deletedAt) return null;
            if (user.isRestricted) {
              throw new Error("AccountRestricted");
            }

            const valid = await bcryptjs.compare(password, user.passwordHash);
            if (valid) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                role: user.primaryRole as UserRole,
              };
            }
          }
        } catch (dbErr) {
          console.warn("[Auth] DB lookup failed, using dev session fallback:", dbErr instanceof Error ? dbErr.message : dbErr);
        }

        // In development mode, if DB is offline or user was registered in dev mode:
        if (process.env.NODE_ENV === "development") {
          return {
            id: `dev-user-${email.split("@")[0]}`,
            email,
            name: email.split("@")[0],
            role: "citizen" as UserRole,
          };
        }

        return null;
      },
    }),

    // Google provider — only active if env vars are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign-in, add the role to the JWT
      if (user) {
        token.id = user.id;
        try {
          const [dbUser] = await db
            .select({ primaryRole: users.primaryRole })
            .from(users)
            .where(eq(users.id, user.id as string))
            .limit(1);
          token.role = (dbUser?.primaryRole ?? user.role ?? "citizen") as UserRole;
        } catch {
          token.role = (user.role ?? "citizen") as UserRole;
        }
      }

      // Refresh role on session update
      if (trigger === "update" && token.id) {
        try {
          const [dbUser] = await db
            .select({ primaryRole: users.primaryRole, isRestricted: users.isRestricted })
            .from(users)
            .where(eq(users.id, token.id as string))
            .limit(1);
          if (dbUser) {
            token.role = dbUser.primaryRole as UserRole;
            token.isRestricted = dbUser.isRestricted;
          }
        } catch {
          // Keep existing token fields
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.isRestricted = token.isRestricted as boolean | undefined;
      }
      return session;
    },

    async signIn({ user, account }) {
      if (!user.id) return false;

      // For OAuth sign-ins, create profile & preferences if missing
      if (account?.type === "oauth") {
        try {
          const [existing] = await db
            .select({ id: profiles.id })
            .from(profiles)
            .where(eq(profiles.userId, user.id))
            .limit(1);

          if (!existing) {
            await db.transaction(async (tx) => {
              await tx.insert(profiles).values({
                userId: user.id!,
                displayName: user.name ?? null,
              });
              await tx.insert(userPreferences).values({
                userId: user.id!,
              });
            });
          }
        } catch (err) {
          console.warn("[Auth] OAuth profile auto-creation warning:", err);
        }
      }

      return true;
    },
  },

  // Never expose the secret — it's server-only
  secret: process.env.AUTH_SECRET,

  trustHost: true,

  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
});
