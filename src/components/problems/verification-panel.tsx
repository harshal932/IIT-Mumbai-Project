"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { ShieldCheck, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { VerificationBadge } from "@/components/ui/badge";

interface VerificationPanelProps {
  problemId: string;
  verificationStatus: string;
  verificationCount: number;
  isAuthor?: boolean;
}

export function VerificationPanel({
  problemId,
  verificationStatus,
  verificationCount: initialCount,
  isAuthor = false,
}: VerificationPanelProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"confirm" | "dispute" | "evidence">("confirm");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [hasVerified, setHasVerified] = useState(false);
  const toast = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      const res = await fetch(`/api/problems/${problemId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationType: type,
          note: note.trim() || undefined,
        }),
        signal: AbortSignal.timeout(12000),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to submit verification");
      }

      toast.success(
        "Verification submitted!",
        "Thank you for helping verify ground truth in your community."
      );
      setHasVerified(true);
      setCount((prev) => prev + (type === "dispute" ? 0 : 1));
      setOpen(false);
      setNote("");
    } catch (err: unknown) {
      const msg =
        err instanceof DOMException && err.name === "TimeoutError"
          ? "The request timed out. Please try again."
          : err instanceof Error
            ? err.message
            : "Failed to verify";
      toast.error("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Community Ground Truth
          </span>
        </div>
        <VerificationBadge status={verificationStatus} />
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400">
        {count === 0
          ? "This problem has not yet been verified by local residents."
          : `${count} community member${count === 1 ? "" : "s"} have verified or provided evidence for this issue.`}
      </p>

      {!isAuthor && !hasVerified && (
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          Verify or Dispute Issue
        </Button>
      )}

      {hasVerified && (
        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          ✓ You have submitted feedback for this problem.
        </p>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Verify Community Problem"
        description="Help confirm whether this local problem is genuine and active."
      >
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
              Select Verification Type
            </label>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setType("confirm")}
                className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-colors ${
                  type === "confirm"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-400"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold block">I can confirm this problem exists</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    I live nearby or have seen/experienced this issue firsthand.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType("dispute")}
                className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-colors ${
                  type === "dispute"
                    ? "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200 ring-2 ring-red-400"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold block">Dispute / Information is inaccurate</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    This problem is resolved, exaggerated, or false.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType("evidence")}
                className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-colors ${
                  type === "evidence"
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-400"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <FileText className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold block">I can provide additional evidence</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Share an observation, work-order number, or local context that supports this report.
                  </span>
                </div>
              </button>
            </div>
          </div>

          <Textarea
            label="Additional Details (Optional)"
            placeholder="Share specific details about what you observed or verified..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Submit Verification
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
