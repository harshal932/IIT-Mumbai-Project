"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { User, Settings, LogOut, ShieldCheck } from "lucide-react";
import { signOut } from "next-auth/react";

interface UserNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export function UserNav({ user }: UserNavProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const profileHref = `/profile/${encodeURIComponent(user.email ?? "me")}`;

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-indigo-500/50 transition-all focus:outline-hidden"
        aria-label="User navigation menu"
        aria-expanded={open}
      >
        <Avatar src={user.image} name={user.name || user.email} size="sm" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
              {user.name || "Community Resident"}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>

          <div className="space-y-0.5">
            <Link
              href={profileHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <User className="h-4 w-4 text-indigo-500" />
              <span>My Profile</span>
            </Link>

            <Link
              href="/profile/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings className="h-4 w-4 text-gray-400" />
              <span>Settings</span>
            </Link>
          </div>

          <div className="mt-1 pt-1 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SidebarSignOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
    >
      <LogOut className="h-5 w-5 text-red-500" aria-hidden="true" />
      <span>Sign Out</span>
    </button>
  );
}
