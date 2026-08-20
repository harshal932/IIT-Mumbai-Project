import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
}

const variantClasses = {
  default: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const sizeClasses = {
  sm: "px-1.5 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  variant = "default",
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Urgency badge
export function UrgencyBadge({ urgency }: { urgency: string }) {
  const config = {
    low: { variant: "success" as const, label: "Low", symbol: "◑" },
    medium: { variant: "warning" as const, label: "Medium", symbol: "●" },
    high: { variant: "danger" as const, label: "High", symbol: "▲" },
    critical: { variant: "danger" as const, label: "Critical", symbol: "⚠" },
  };
  const c = config[urgency as keyof typeof config] ?? config.medium;
  return (
    <Badge variant={c.variant}>
      <span aria-hidden="true">{c.symbol}</span>
      <span>{c.label} Urgency</span>
    </Badge>
  );
}

// Status badge
export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    open: { variant: "info", label: "Open" },
    receiving_support: { variant: "default", label: "Receiving Support" },
    verification_in_progress: { variant: "warning", label: "Verifying" },
    help_matched: { variant: "default", label: "Help Matched" },
    action_in_progress: { variant: "warning", label: "In Progress" },
    awaiting_authority: { variant: "neutral", label: "Awaiting Authority" },
    partially_solved: { variant: "warning", label: "Partially Solved" },
    solved_pending_confirmation: { variant: "success", label: "Pending Confirmation" },
    resolved: { variant: "success", label: "Resolved ✓" },
    closed: { variant: "neutral", label: "Closed" },
    disputed: { variant: "danger", label: "Disputed" },
    archived: { variant: "neutral", label: "Archived" },
  };
  const c = config[status] ?? { variant: "neutral" as const, label: status };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

// Verification badge
export function VerificationBadge({ status }: { status: string }) {
  const config: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    unverified: { variant: "neutral", label: "Unverified" },
    evidence_attached: { variant: "info", label: "Evidence Attached" },
    community_confirmed: { variant: "success", label: "Community Confirmed" },
    multiple_reports: { variant: "warning", label: "Multiple Reports" },
    org_confirmed: { variant: "success", label: "Org Confirmed" },
    officially_acknowledged: { variant: "success", label: "Officially Acknowledged" },
    resolution_confirmed: { variant: "success", label: "Resolution Confirmed" },
  };
  const c = config[status] ?? { variant: "neutral" as const, label: status };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}
