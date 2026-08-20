"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useLocation } from "@/components/location/location-provider";
import { haversineDistance } from "@/lib/utils/geo";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, Radio, Filter, Search, Loader2, X, AlertCircle } from "lucide-react";
import type { ProblemPublic } from "@/lib/types";

interface ProblemMapProps {
  problems: ProblemPublic[];
  selectedProblemId?: string;
  onSelectProblem?: (id: string) => void;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  className?: string;
  initialCenter?: [number, number];
  initialSearchQuery?: string;
  initialProblemId?: string;
  initialLocationName?: string;
}

// Dynamically import Leaflet with ssr: false
const DynamicMap = dynamic(() => import("./problem-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 text-sm font-medium animate-pulse">
      Loading Leaflet Map…
    </div>
  ),
});

interface LocationSearchResult {
  displayName: string;
  lat: number;
  lon: number;
}

export function ProblemMap({
  problems,
  selectedProblemId,
  onSelectProblem,
  center,
  zoom = 13,
  interactive = true,
  className = "h-full w-full",
  initialCenter,
  initialSearchQuery = "",
  initialProblemId,
  initialLocationName,
}: ProblemMapProps) {
  const [mounted, setMounted] = useState(false);
  const [filter5km, setFilter5km] = useState(true);
  const [perimeterKm, setPerimeterKm] = useState(5);

  const {
    userLocation,
    permissionStatus,
    requestLocationPermission,
  } = useLocation();

  // Active Map Center: defaults to initialCenter or userLocation or NYC default
  const [activeCenter, setActiveCenter] = useState<{
    coords: [number, number];
    label: string;
    isUserGps: boolean;
  }>(() => {
    if (initialCenter) {
      return {
        coords: initialCenter,
        label: initialLocationName || "Searched Location",
        isUserGps: false,
      };
    }
    return {
      coords: [40.7128, -74.006],
      label: "Default NYC",
      isUserGps: false,
    };
  });

  // Search state
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [searchLoading, setSearchLoading] = useState(false);
  const [locationResults, setLocationResults] = useState<LocationSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Update center when initialCenter prop changes
  useEffect(() => {
    if (initialCenter) {
      setActiveCenter({
        coords: initialCenter,
        label: initialLocationName || "Searched Location",
        isUserGps: false,
      });
    }
  }, [initialCenter, initialLocationName]);

  // Update center to user GPS on initial load if no explicit searched initialCenter was provided
  useEffect(() => {
    setMounted(true);
    if (!initialCenter && userLocation) {
      setActiveCenter({
        coords: [userLocation.lat, userLocation.lng],
        label: "My Live Position",
        isUserGps: true,
      });
    }
  }, [userLocation, initialCenter]);

  // Debounced search for city/location in map bar
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setLocationResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setLocationResults(data.locations || []);
          setShowSearchResults(true);
        }
      } catch (err) {
        console.warn("Map search error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const userGpsCoords: [number, number] | null = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    return null;
  }, [userLocation]);

  // Recenter to user's live GPS location
  const handleRecenterToUserGps = async () => {
    if (userGpsCoords) {
      setActiveCenter({
        coords: userGpsCoords,
        label: "My Live Position",
        isUserGps: true,
      });
    } else {
      const success = await requestLocationPermission();
      if (success && userLocation) {
        setActiveCenter({
          coords: [userLocation.lat, userLocation.lng],
          label: "My Live Position",
          isUserGps: true,
        });
      }
    }
  };

  // Select searched city/location
  const handleSelectSearchedLocation = (loc: LocationSearchResult) => {
    setActiveCenter({
      coords: [loc.lat, loc.lon],
      label: loc.displayName.split(",")[0] || loc.displayName,
      isUserGps: false,
    });
    setSearchQuery(loc.displayName.split(",")[0] || loc.displayName);
    setShowSearchResults(false);
  };

  // Filter problems:
  // 1. By search query (if typed problem keyword like 'pothole')
  // 2. By 5km distance from activeCenter (if 5km filter enabled)
  const { filteredProblems, nearbyCount, matchingProblemsCount } = useMemo(() => {
    let result = problems;
    let queryMatches = problems.length;

    // Filter by text search query if provided
    if (searchQuery.trim().length >= 2) {
      const qLower = searchQuery.toLowerCase().trim();
      const matched = problems.filter(
        (p) =>
          p.title.toLowerCase().includes(qLower) ||
          p.description.toLowerCase().includes(qLower) ||
          p.locationArea.toLowerCase().includes(qLower)
      );
      if (matched.length > 0) {
        result = matched;
        queryMatches = matched.length;
      }
    }

    // Compute distance from activeCenter
    const withDist = result.map((p) => {
      const dist = haversineDistance(
        activeCenter.coords[0],
        activeCenter.coords[1],
        p.latitude,
        p.longitude
      );
      return { problem: p, dist };
    });

    const insidePerimeter = withDist.filter((item) => item.dist <= perimeterKm);
    const nearbyCount = insidePerimeter.length;

    let displayProblems = filter5km ? insidePerimeter.map((i) => i.problem) : result;
    if (filter5km && displayProblems.length === 0) {
      // Fallback: if no problems within exact 5km of searched city, show available matching problems
      displayProblems = result;
    }

    return {
      filteredProblems: displayProblems,
      nearbyCount,
      matchingProblemsCount: queryMatches,
    };
  }, [problems, searchQuery, activeCenter, filter5km, perimeterKm]);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 text-sm font-medium">
        Initializing map…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Realtime 5km Perimeter Control Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs z-10 shadow-2xs">
        
        {/* Left Side: Active Center Badge & Recenter Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <Radio className="h-3.5 w-3.5 animate-pulse text-indigo-500 shrink-0" />
            <span className="line-clamp-1">5km Perimeter around {activeCenter.label}</span>
          </div>

          {/* Quick Recenter to User GPS */}
          <Button
            size="sm"
            variant={activeCenter.isUserGps ? "primary" : "outline"}
            onClick={handleRecenterToUserGps}
            className={`h-7 px-2.5 text-xs font-semibold flex items-center gap-1 ${
              activeCenter.isUserGps
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "text-gray-700 dark:text-gray-200"
            }`}
            title="Recenter map to your actual live GPS location"
          >
            <Navigation className="h-3 w-3 text-indigo-400" />
            {activeCenter.isUserGps ? "Centered at My GPS" : "Recenter to My Position"}
          </Button>
        </div>

        {/* Right Side: Quick In-Map Search & Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Quick In-Map City & Problem Search Box */}
          <div ref={searchContainerRef} className="relative w-48 sm:w-60">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search city or problem..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (locationResults.length > 0) setShowSearchResults(true);
                }}
                className="h-7 w-full rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 pl-8 pr-7 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchLoading && (
                <Loader2 className="animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-500" />
              )}
              {!searchLoading && searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearchResults(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* City Search Suggestions Dropdown */}
            {showSearchResults && locationResults.length > 0 && (
              <div className="absolute top-full mt-1.5 inset-x-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden text-xs">
                <div className="p-1.5 font-bold text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                  Locations Found (Click to jump map)
                </div>
                {locationResults.map((loc, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSearchedLocation(loc)}
                    className="w-full text-left flex items-start gap-2 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors border-b last:border-0 border-gray-50 dark:border-gray-800/50"
                  >
                    <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 text-[11px] text-gray-800 dark:text-gray-200">
                      {loc.displayName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-[11px] text-gray-500 font-medium hidden sm:inline">
            {nearbyCount} issue{nearbyCount !== 1 ? "s" : ""} within {perimeterKm}km
          </span>

          <Button
            size="sm"
            variant={filter5km ? "primary" : "outline"}
            onClick={() => setFilter5km(!filter5km)}
            className={`h-7 px-2.5 text-xs font-semibold ${
              filter5km
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "text-gray-600 dark:text-gray-300"
            }`}
          >
            <Filter className="h-3 w-3 mr-1" />
            {filter5km ? "5km Filter On" : "Show All"}
          </Button>
        </div>
      </div>

      {/* Main Leaflet Map View */}
      <div className="flex-1 w-full relative">
        <DynamicMap
          problems={filteredProblems}
          selectedProblemId={selectedProblemId || initialProblemId}
          onSelectProblem={onSelectProblem}
          center={center}
          zoom={zoom}
          interactive={interactive}
          className={className}
          userLocation={userGpsCoords}
          scanCenter={activeCenter.coords}
          scanLabel={activeCenter.label}
          perimeterKm={perimeterKm}
          showPerimeterCircle={filter5km}
        />
      </div>
    </div>
  );
}
