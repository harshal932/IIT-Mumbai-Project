"use client";

import { useState } from "react";
import { useLocation } from "./location-provider";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ShieldCheck, Radio, X } from "lucide-react";

export function LocationPermissionModal() {
  const { showModal, setShowModal, requestLocationPermission, permissionStatus, isMonitoring } = useLocation();
  const [loading, setLoading] = useState(false);

  if (!showModal) return null;

  const handleGrant = async () => {
    setLoading(true);
    try {
      await requestLocationPermission();
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Realtime Location Access
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Automatic 5km Map Perimeter Scanning
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-2.5">
            <Navigation className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              <strong>Real-Time Map Updating:</strong> Automatically detects your exact location whenever you view the map.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              <strong>5km Perimeter Scan:</strong> Scans problems reported within 5km of your location to show issues affecting your neighborhood first.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Privacy Protection:</strong> Exact coordinates are fuzz-protected for privacy before display.
            </span>
          </div>
        </div>

        {permissionStatus === "denied" && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium text-center bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg">
            Location access was previously blocked in your browser. Please allow location permissions in your browser settings.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <Button
            onClick={handleGrant}
            loading={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            Enable Realtime Access
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="sm:w-28 text-gray-500 hover:text-gray-700"
          >
            Not Now
          </Button>
        </div>
      </div>
    </div>
  );
}
