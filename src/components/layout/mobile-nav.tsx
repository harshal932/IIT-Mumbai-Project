"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Bell, Plus, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/map", label: "Map", icon: MapPin },
  { href: "/problems/create", label: "Report", icon: Plus, highlight: true },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/saved", label: "Saved", icon: BookMarked },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-bottom"
      aria-label="Mobile navigation"
    >
      <ul className="flex items-center justify-around h-16 px-2">
        {items.map(({ href, label, icon: Icon, highlight }) => {
          const active = pathname.startsWith(href) && !highlight;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors text-xs font-medium",
                  highlight
                    ? "bg-indigo-600 text-white rounded-xl px-4"
                    : active
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    highlight ? "h-5 w-5" : ""
                  )}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
