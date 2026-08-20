import { cn } from "@/lib/utils/cn";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

type AlertVariant = "info" | "success" | "warning" | "danger";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const config = {
  info: {
    wrapper: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700",
    icon: Info,
    iconClass: "text-blue-600 dark:text-blue-400",
    titleClass: "text-blue-800 dark:text-blue-300",
    bodyClass: "text-blue-700 dark:text-blue-400",
  },
  success: {
    wrapper: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700",
    icon: CheckCircle,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    titleClass: "text-emerald-800 dark:text-emerald-300",
    bodyClass: "text-emerald-700 dark:text-emerald-400",
  },
  warning: {
    wrapper: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700",
    icon: AlertTriangle,
    iconClass: "text-amber-600 dark:text-amber-400",
    titleClass: "text-amber-800 dark:text-amber-300",
    bodyClass: "text-amber-700 dark:text-amber-400",
  },
  danger: {
    wrapper: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700",
    icon: AlertCircle,
    iconClass: "text-red-600 dark:text-red-400",
    titleClass: "text-red-800 dark:text-red-300",
    bodyClass: "text-red-700 dark:text-red-400",
  },
};

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  const c = config[variant];
  const Icon = c.icon;
  return (
    <div
      role="alert"
      className={cn("flex gap-3 rounded-lg border p-4", c.wrapper, className)}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", c.iconClass)} aria-hidden="true" />
      <div className="text-sm">
        {title && <p className={cn("font-semibold mb-1", c.titleClass)}>{title}</p>}
        <div className={c.bodyClass}>{children}</div>
      </div>
    </div>
  );
}
