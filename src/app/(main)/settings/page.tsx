import { auth } from "@/auth";
import { SidebarSignOutButton } from "@/components/layout/user-nav";
import { Settings, Shield, Bell, LogOut, User } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          Account & App Settings
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage your account preferences, notification alerts, and session state.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <User className="h-4 w-4 text-indigo-500" />
          Account Information
        </h2>
        <div className="space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-200">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="font-medium text-gray-500">Name</span>
            <span className="font-semibold">{session?.user?.name || "Community Member"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="font-medium text-gray-500">Email</span>
            <span className="font-semibold">{session?.user?.email || "resident@example.com"}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="font-medium text-gray-500">Role</span>
            <span className="font-semibold capitalize">{session?.user?.role || "citizen"}</span>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <Bell className="h-4 w-4 text-emerald-500" />
          Notification Alerts
        </h2>
        <div className="space-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <span>Email alerts for nearby community reports</span>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-indigo-600" />
          </label>
          <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <span>Status updates on reported problems</span>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded accent-indigo-600" />
          </label>
        </div>
      </div>

      {/* Danger Zone & Sign Out */}
      <div className="bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200/60 dark:border-red-900/40 p-6 space-y-4 shadow-2xs">
        <h2 className="text-sm font-bold text-red-900 dark:text-red-200 flex items-center gap-2">
          <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
          Session & Sign Out
        </h2>
        <p className="text-xs text-red-700 dark:text-red-300">
          Sign out of your active session on this device. You can log back in at any time with your credentials.
        </p>
        <div className="pt-2 max-w-xs">
          <SidebarSignOutButton />
        </div>
      </div>
    </div>
  );
}
