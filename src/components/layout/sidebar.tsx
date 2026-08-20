"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { SidebarSignOutButton } from "@/components/layout/user-nav";
import {
  Home,
  MapPin,
  Bell,
  Bookmark,
  Building2,
  Settings,
  HelpCircle,
  ShieldCheck,
  Flag,
  Plus,
} from "lucide-react";

const navItems = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/map", label: "Map", icon: MapPin },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/organizations", label: "Organizations", icon: Building2 },
];

const modNavItems = [
  { href: "/admin", label: "Dashboard", icon: ShieldCheck },
  { href: "/admin/reports", label: "Reports Queue", icon: Flag },
];

interface SidebarProps {
  currentPath: string;
  userRole?: string;
  className?: string;
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5",
          active ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"
        )}
        aria-hidden="true"
      />
      {label}
    </Link>
  );
}

export function Sidebar({ currentPath, userRole, className }: SidebarProps) {
  const isMod = userRole === "moderator" || userRole === "admin";

  return (
    <aside
      className={cn(
        "flex flex-col gap-1 w-56 shrink-0 py-4 px-2",
        className
      )}
      aria-label="Main navigation"
    >
      {/* Create button */}
      <Link
        href="/problems/create"
        className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 active:bg-indigo-800 transition-colors mb-3"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Report a Problem
      </Link>

      <nav>
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavItem
                {...item}
                active={currentPath.startsWith(item.href)}
              />
            </li>
          ))}
        </ul>
      </nav>

      {isMod && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Moderation
          </p>
          <nav>
            <ul className="space-y-0.5">
              {modNavItems.map((item) => (
                <li key={item.href}>
                  <NavItem
                    {...item}
                    active={currentPath.startsWith(item.href)}
                  />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700 space-y-0.5">
        <NavItem
          href="/settings"
          label="Settings"
          icon={Settings}
          active={currentPath.startsWith("/settings")}
        />
        <NavItem
          href="/terms"
          label="Help & Legal"
          icon={HelpCircle}
          active={currentPath.startsWith("/terms")}
        />
        <SidebarSignOutButton />
      </div>
    </aside>
  );
}
