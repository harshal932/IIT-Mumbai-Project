import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function hashColor(name?: string | null): string {
  const colors = [
    "bg-indigo-500",
    "bg-violet-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-fuchsia-500",
    "bg-teal-500",
  ];
  if (!name) return colors[0];
  const index = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const color = hashColor(name);
  const init = initials(name);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 font-semibold text-white",
        sizeClasses[size],
        src ? "bg-gray-200 dark:bg-gray-700" : color,
        className
      )}
      aria-hidden="true"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        <span>{init}</span>
      )}
    </span>
  );
}
