import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock, Building2, User, AlertCircle } from "lucide-react";
import type { StatusTimelineEvent } from "@/lib/types";

interface StatusTimelineProps {
  events: StatusTimelineEvent[];
}

export function StatusTimeline({ events }: StatusTimelineProps) {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider text-xs">
        Problem Timeline & Progress
      </h4>
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
        {events.map((evt) => {
          const isOrg = evt.actorRole === "authority" || evt.actorRole === "org_member";

          return (
            <div key={evt.id} className="relative">
              <span className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900 ${
                isOrg ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
              }`}>
                {isOrg ? <Building2 className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
              </span>

              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 rounded-lg shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {evt.actorDisplayName}
                    {evt.actorRole && (
                      <span className="ml-1.5 font-normal text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase">
                        {evt.actorRole}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {formatDistanceToNow(new Date(evt.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {evt.newStatus && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                    Status changed to: <span className="capitalize">{evt.newStatus.replace(/_/g, " ")}</span>
                  </p>
                )}

                {evt.message && (
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {evt.message}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
