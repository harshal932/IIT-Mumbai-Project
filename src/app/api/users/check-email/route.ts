import { NextRequest } from "next/server";
import { db, withDbFallback } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const emailSchema = z.string().email();

// GET /api/users/check-email?email=user@example.com
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawEmail = searchParams.get("email")?.trim().toLowerCase();

    if (!rawEmail) {
      return Response.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const parseResult = emailSchema.safeParse(rawEmail);
    if (!parseResult.success) {
      return Response.json(
        { error: "Invalid email format", isRegistered: false },
        { status: 400 }
      );
    }

    const email = parseResult.data;

    // Check database with fallback
    const userRow = await withDbFallback(async () => {
      const [row] = await db
        .select({ id: users.id, name: users.name, email: users.email, role: users.primaryRole })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return row ?? null;
    }, null);

    if (userRow) {
      return Response.json({
        isRegistered: true,
        exists: true,
        user: {
          name: userRow.name || userRow.email.split("@")[0],
          email: userRow.email,
          role: userRow.role,
        },
      });
    }

    // Default test users for demo/offline fallback matching
    const DEMO_EMAILS = [
      "citizen@example.com",
      "alex@example.com",
      "admin@localloop.org",
      "moderator@localloop.org",
      "user@example.com",
    ];

    if (DEMO_EMAILS.includes(email)) {
      return Response.json({
        isRegistered: true,
        exists: true,
        user: {
          name: email.split("@")[0],
          email,
          role: email.includes("admin") ? "admin" : "citizen",
        },
      });
    }

    return Response.json({
      isRegistered: false,
      exists: false,
      message: "This email address is not registered in our database. Please create a new account to sign in.",
    });
  } catch (err) {
    console.error("[check-email] Error:", err);
    return Response.json({ isRegistered: false, error: "Internal server error" }, { status: 500 });
  }
}
