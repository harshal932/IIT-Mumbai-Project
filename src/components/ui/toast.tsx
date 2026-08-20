"use client";

import { cn } from "@/lib/utils/cn";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colorClasses = {
  success: "border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30",
  error: "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/30",
  warning: "border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30",
  info: "border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30",
};

const iconColors = {
  success: "text-emerald-600 dark:text-emerald-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-blue-600 dark:text-blue-400",
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const Icon = icons[toast.type];
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 shadow-lg",
        "animate-in slide-in-from-right-5 fade-in-0",
        colorClasses[toast.type]
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", iconColors[toast.type])} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => showToast({ type: "success", title, message }), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast({ type: "error", title, message }), [showToast]);
  const warning = useCallback((title: string, message?: string) => showToast({ type: "warning", title, message }), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast({ type: "info", title, message }), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
