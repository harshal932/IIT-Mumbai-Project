import { cn } from "@/lib/utils/cn";
import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, showCount, maxLength, value, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const charCount = typeof value === "string" ? value.length : 0;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          maxLength={maxLength}
          value={value}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm min-h-[100px] resize-y",
            "bg-white text-gray-900 placeholder:text-gray-400",
            "dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500",
            "transition-colors",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-200"
              : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100 dark:border-gray-600",
            "focus:outline-none focus:ring-2",
            "disabled:cursor-not-allowed disabled:opacity-60",
            className
          )}
          {...props}
        />
        <div className="flex justify-between items-start gap-2">
          <div>
            {error && (
              <p id={`${inputId}-error`} className="text-xs text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            {!error && hint && (
              <p id={`${inputId}-hint`} className="text-xs text-gray-500 dark:text-gray-400">
                {hint}
              </p>
            )}
          </div>
          {showCount && maxLength && (
            <span className={cn(
              "text-xs shrink-0",
              charCount > maxLength * 0.9 ? "text-orange-500" : "text-gray-400"
            )}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
