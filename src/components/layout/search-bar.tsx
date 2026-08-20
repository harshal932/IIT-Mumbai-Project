"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, FileText, Loader2, X } from "lucide-react";
import Link from "next/link";

interface SearchResultProblem {
  id: string;
  title: string;
  locationArea: string;
  urgency: string;
  status: string;
}

interface SearchResultLocation {
  displayName: string;
  lat: number;
  lon: number;
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [problems, setProblems] = useState<SearchResultProblem[]>([]);
  const [locations, setLocations] = useState<SearchResultLocation[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search query trigger
  useEffect(() => {
    if (query.trim().length < 2) {
      setProblems([]);
      setLocations([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setProblems(data.problems || []);
          setLocations(data.locations || []);
          setOpen(true);
        }
      } catch (err) {
        console.warn("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLocation = (loc: SearchResultLocation) => {
    setOpen(false);
    setQuery("");
    router.push(`/map?lat=${loc.lat}&lng=${loc.lon}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md hidden sm:block">
      <label htmlFor="global-search" className="sr-only">
        Search problems or locations
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          aria-hidden="true"
        />
        <input
          id="global-search"
          type="search"
          placeholder="Search problems or locations (e.g. 5th Ave, Pothole)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (problems.length > 0 || locations.length > 0) setOpen(true);
          }}
          className="h-9 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-8 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />

        {loading && (
          <Loader2 className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
        )}

        {!loading && query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Auto-complete Dropdown Menu */}
      {open && (problems.length > 0 || locations.length > 0) && (
        <div className="absolute top-full mt-2 inset-x-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95">
          {/* Problems Matching */}
          {problems.length > 0 && (
            <div className="p-2 space-y-1">
              <span className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Problems
              </span>
              {problems.map((p) => (
                <Link
                  key={p.id}
                  href={`/problems/${p.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                >
                  <FileText className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {p.title}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">{p.locationArea}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Locations Matching */}
          {locations.length > 0 && (
            <div className="p-2 space-y-1 border-t border-gray-100 dark:border-gray-800">
              <span className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                OpenStreetMap Locations
              </span>
              {locations.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">
                    {loc.displayName}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
