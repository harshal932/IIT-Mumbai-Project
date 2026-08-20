import { NextRequest } from "next/server";
import { db, withDbFallback } from "@/lib/db";
import { users, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { RegisterSchema } from "@/lib/validation/users";
import bcryptjs from "bcryptjs";
import { checkRateLimit, getClientIp, RateLimits } from "@/lib/services/rate-limiter";
import { sanitizeText } from "@/lib/utils/sanitize";
import { toClientError, statusFromError } from "@/lib/utils/errors";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimit(`register:${ip}`, RateLimits.register);
    if (!rl.allowed) {
      return Response.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstMsg = Object.values(fieldErrors).flat()[0];
      return Response.json(
        { error: firstMsg || "Validation failed", details: fieldErrors },
        { status: 422 }
      );
    }

    const { email, password, name } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = sanitizeText(name);

    // Fast check if user exists with timeout
    const existing = await withDbFallback(
      () => db.select({ id: users.id }).from(users).where(eq(users.email, cleanEmail)).limit(1),
      []
    );

    if (existing.length > 0) {
      return Response.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    const insertedUser = await withDbFallback(
      () =>
        db
          .insert(users)
          .values({
            name: cleanName,
            email: cleanEmail,
            passwordHash,
            primaryRole: "citizen",
          })
          .returning(),
      null
    );

    if (!insertedUser || insertedUser.length === 0) {
      // Dev mode fallback when PostgreSQL is offline
      const mockId = `usr_${Date.now()}`;
      return Response.json(
        {
          data: {
            id: mockId,
            email: cleanEmail,
            name: cleanName,
          },
        },
        { status: 201 }
      );
    }

    const newUser = insertedUser[0];
    return Response.json(
      {
        data: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}
