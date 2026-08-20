import { NextRequest } from "next/server";
import { db, withDbFallback } from "@/lib/db";
import { problems } from "@/lib/db/schema";
import { ilike, or, eq, and, desc } from "drizzle-orm";
import { searchLocations } from "@/lib/services/geocoding";
import { toClientError, statusFromError } from "@/lib/utils/errors";

const MOCK_SEARCH_PROBLEMS = [
  {
    id: "sample-1",
    title: "Broken Streetlight at 5th Ave & 14th St",
    locationArea: "5th Ave & 14th St, Manhattan",
    urgency: "high",
    status: "open",
  },
  {
    id: "sample-2",
    title: "Deep Pothole Causing Tire Damage on Main St",
    locationArea: "Main St near Bus Stop, Brooklyn",
    urgency: "critical",
    status: "receiving_support",
  },
];

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const q = url.searchParams.get("q") ?? "";

    if (!q || q.trim().length < 2) {
      return Response.json({ problems: [], locations: [] });
    }

    const searchTerm = q.trim();

    const problemResults = await withDbFallback(
      () =>
        db
          .select({
            id: problems.id,
            title: problems.title,
            locationArea: problems.locationArea,
            urgency: problems.urgency,
            status: problems.status,
          })
          .from(problems)
          .where(
            and(
              eq(problems.isDeleted, false),
              or(
                ilike(problems.title, `%${searchTerm}%`),
                ilike(problems.description, `%${searchTerm}%`),
                ilike(problems.locationArea, `%${searchTerm}%`)
              )
            )
          )
          .orderBy(desc(problems.createdAt))
          .limit(6),
      MOCK_SEARCH_PROBLEMS.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.locationArea.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    const locationResults = await searchLocations(searchTerm);

    return Response.json({
      problems: problemResults,
      locations: locationResults,
    });
  } catch (err) {
    return Response.json(toClientError(err), { status: statusFromError(err) });
  }
}
