"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ProblemPublic } from "@/lib/types";

interface ProblemMapProps {
  problems: ProblemPublic[];
  selectedProblemId?: string;
  onSelectProblem?: (id: string) => void;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  className?: string;
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

export function ProblemMap(props: ProblemMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 text-sm font-medium">
        Initializing map…
      </div>
    );
  }

  return <DynamicMap {...props} />;
}
