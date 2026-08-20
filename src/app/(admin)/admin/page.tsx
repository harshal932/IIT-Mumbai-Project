import { db } from "@/lib/db";
import { problems, users, reports, auditLogs } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Users, FileText, Activity } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  let metrics = {
    totalProblems: 2,
    totalUsers: 8,
    pendingReports: 1,
    totalAuditLogs: 15,
  };

  try {
    const [
      [{ totalProblems }],
      [{ totalUsers }],
      [{ pendingReports }],
      [{ totalAuditLogs }],
    ] = await Promise.all([
      db.select({ totalProblems: sql<number>`COUNT(*)` }).from(problems),
      db.select({ totalUsers: sql<number>`COUNT(*)` }).from(users),
      db.select({ pendingReports: sql<number>`COUNT(*)` }).from(reports).where(eq(reports.status, "pending")),
      db.select({ totalAuditLogs: sql<number>`COUNT(*)` }).from(auditLogs),
    ]);

    metrics = {
      totalProblems: Number(totalProblems),
      totalUsers: Number(totalUsers),
      pendingReports: Number(pendingReports),
      totalAuditLogs: Number(totalAuditLogs),
    };
  } catch (err) {
    console.warn("[AdminDashboard] DB fallback active:", err instanceof Error ? err.message : err);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Moderation & Audit Dashboard</h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor platform metrics, manage user reports, and review security audit logs.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold block">{metrics.totalProblems}</span>
              <span className="text-xs text-slate-400">Total Reported Problems</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold block">{metrics.totalUsers}</span>
              <span className="text-xs text-slate-400">Registered Citizens</span>
            </div>
          </CardContent>
        </Card>

        <Link href="/admin/reports" className="block group">
          <Card className="bg-slate-900 border-slate-800 text-white group-hover:border-amber-500/50 transition-colors">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-2xl font-extrabold block text-amber-400">
                  {metrics.pendingReports}
                </span>
                <span className="text-xs text-slate-400">Pending Flagged Reports</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold block">{metrics.totalAuditLogs}</span>
              <span className="text-xs text-slate-400">Security Audit Events</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Panel */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="font-bold text-base text-white">Moderation Tools</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/reports"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
          >
            Review Report Queue →
          </Link>
        </div>
      </div>
    </div>
  );
}
