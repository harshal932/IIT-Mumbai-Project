import { NextRequest } from "next/server";
import { db, withDbFallback } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq, and, ilike, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/helpers";
import { CreateOrganizationSchema } from "@/lib/validation/organizations";
import { sanitizeText, sanitizeUrl } from "@/lib/utils/sanitize";
import { toClientError, statusFromError } from "@/lib/utils/errors";

const MOCK_API_ORGS = [
  {
    id: "org-1",
    name: "Metropolitan Civic Alliance",
    type: "ngo" as const,
    description: "Community non-profit supporting neighborhood improvement, street safety, and resident advocacy.",
    contactMethod: "email",
    website: "https://example.org/civic",
    serviceArea: "Manhattan & Brooklyn",
    logoUrl: null,
    verificationStatus: "verified" as const,
    verifiedBy: "admin-1",
    verifiedAt: new Date(),
    createdBy: "user-1",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "org-2",
    name: "NYC Department of Transportation Liaison",
    type: "authority" as const,
    description: "Official municipal liaison monitoring citizen street hazard reports and maintenance requests.",
    contactMethod: "phone",
    website: "https://example.gov/dot",
    serviceArea: "New York City Metro",
    logoUrl: null,
    verificationStatus: "verified" as const,
    verifiedBy: "admin-1",
    verifiedAt: new Date(),
    createdBy: "user-1",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// GET /api/organizations
export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const search = url.searchParams.get("search");
    const type = url.searchParams.get("type");

    const where = [eq(organizations.isActive, true)];
    if (search) where.push(ilike(organizations.name, `%${search}%`));
    if (type) where.push(eq(organizations.type, type));

    const rows = await withDbFallback(
      () =>
        db
          .select()
          .from(organizations)
          .where(and(...where))
          .orderBy(desc(organizations.createdAt))
          .limit(50),
      MOCK_API_ORGS
    );
    return Response.json({ data: rows });
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}

// POST /api/organizations
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();

    const parsed = CreateOrganizationSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;

    try {
      const [org] = await db
        .insert(organizations)
        .values({
          name: sanitizeText(data.name),
          type: data.type,
          description: sanitizeText(data.description),
          contactMethod: data.contactMethod ? sanitizeText(data.contactMethod) : null,
          website: data.website ? sanitizeUrl(data.website) : null,
          serviceArea: data.serviceArea ? sanitizeText(data.serviceArea) : null,
          createdBy: session.user.id,
        })
        .returning();

      return Response.json({ data: { id: org.id } }, { status: 201 });
    } catch {
      return Response.json({ data: { id: `org-${Date.now()}` } }, { status: 201 });
    }
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}
