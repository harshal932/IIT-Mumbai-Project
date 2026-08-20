import { db, withDbFallback } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, MapPin } from "lucide-react";

const MOCK_ORGS = [
  {
    id: "org-1",
    name: "Metropolitan Civic Alliance",
    type: "ngo",
    description: "Community non-profit supporting neighborhood improvement, street safety, and resident advocacy.",
    serviceArea: "Manhattan & Brooklyn",
    website: "https://example.org/civic",
    verificationStatus: "verified",
  },
  {
    id: "org-2",
    name: "NYC Department of Transportation Liaison",
    type: "authority",
    description: "Official municipal liaison monitoring citizen street hazard reports and maintenance requests.",
    serviceArea: "New York City Metro",
    website: "https://example.gov/dot",
    verificationStatus: "verified",
  },
];

export default async function OrganizationsPage() {
  const dbRows = await withDbFallback(
    () =>
      db
        .select()
        .from(organizations)
        .where(eq(organizations.isActive, true))
        .orderBy(desc(organizations.createdAt)),
    []
  );

  let rows = MOCK_ORGS;

  if (dbRows.length > 0) {
    rows = dbRows.map((o) => ({
      id: o.id,
      name: o.name,
      type: o.type,
      description: o.description,
      serviceArea: o.serviceArea ?? "",
      website: o.website ?? "",
      verificationStatus: o.verificationStatus,
    }));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Community Organizations & Authorities
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Verified NGOs, resident groups, and municipal entities supporting local problem resolution.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((org) => (
          <Card key={org.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{org.name}</CardTitle>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {org.type.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <Badge variant={org.verificationStatus === "verified" ? "success" : "neutral"}>
                {org.verificationStatus}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                {org.description}
              </p>
              {org.serviceArea && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span>Area: {org.serviceArea}</span>
                </div>
              )}
              {org.website && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 truncate">
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  <a href={org.website} target="_blank" rel="noreferrer" className="hover:underline truncate">
                    {org.website}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
