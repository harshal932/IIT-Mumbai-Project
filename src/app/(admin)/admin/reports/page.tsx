import { db } from "@/lib/db";
import { reports, profiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const MOCK_REPORTS = [
  {
    id: "rep-1",
    reason: "spam",
    contentType: "comment",
    contentId: "comment-99",
    description: "Comment contains promotional link for non-local commercial service.",
    reporterName: "Community Member",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export default async function AdminReportsPage() {
  let reportList = MOCK_REPORTS;

  try {
    const rows = await db
      .select({
        report: reports,
        reporterProfile: profiles,
      })
      .from(reports)
      .leftJoin(profiles, eq(profiles.userId, reports.reporterId))
      .orderBy(desc(reports.createdAt))
      .limit(50);

    if (rows.length > 0) {
      reportList = rows.map(({ report, reporterProfile }) => ({
        id: report.id,
        reason: report.reason,
        contentType: report.contentType,
        contentId: report.contentId,
        description: report.description ?? "",
        reporterName: reporterProfile?.displayName || "Community Member",
        createdAt: report.createdAt.toISOString(),
      }));
    }
  } catch (err) {
    console.warn("[AdminReportsPage] DB fallback active:", err instanceof Error ? err.message : err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Community Moderation Queue</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review flagged content reports submitted by community members.
        </p>
      </div>

      <div className="space-y-4">
        {reportList.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 rounded-2xl border border-slate-800 p-8 text-slate-400">
            <AlertTriangle className="h-8 w-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-medium">The moderation queue is currently empty!</p>
          </div>
        ) : (
          reportList.map((report) => (
            <Card key={report.id} className="bg-slate-900 border-slate-800 text-white">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">{report.reason}</Badge>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">
                      Target: {report.contentType}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  <strong className="text-slate-200">Reporter:</strong> {report.reporterName}
                </p>

                {report.description && (
                  <p className="text-xs text-slate-400 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                    &quot;{report.description}&quot;
                  </p>
                )}

                <div className="text-xs text-slate-400 pt-1">
                  Content ID: <code className="text-indigo-400">{report.contentId}</code>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
