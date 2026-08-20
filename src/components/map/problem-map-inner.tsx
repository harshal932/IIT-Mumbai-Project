"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { UrgencyBadge, StatusBadge } from "@/components/ui/badge";
import type { ProblemPublic } from "@/lib/types";

// Import Leaflet CSS directly
import "leaflet/dist/leaflet.css";

// Fix standard marker icon issue with Leaflet in React/Webpack
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom colored icons by urgency
function createCustomIcon(urgency: string) {
  const colors: Record<string, string> = {
    low: "#10b981", // emerald
    medium: "#f59e0b", // amber
    high: "#f97316", // orange
    critical: "#dc2626", // red
  };
  const color = colors[urgency] || colors.medium;

  const svgHtml = `
    <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0Z" fill="${color}"/>
      <circle cx="15" cy="15" r="7" fill="white"/>
    </svg>
  `;

  return L.divIcon({
    html: svgHtml,
    className: "custom-leaflet-marker",
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38],
  });
}

interface MapRecenterProps {
  center: [number, number];
  zoom?: number;
}

function MapRecenter({ center, zoom }: MapRecenterProps) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom());
  }, [center, zoom, map]);
  return null;
}

interface ProblemMapInnerProps {
  problems: ProblemPublic[];
  selectedProblemId?: string;
  onSelectProblem?: (id: string) => void;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  className?: string;
}

export default function ProblemMapInner({
  problems,
  selectedProblemId,
  onSelectProblem,
  center = [40.7128, -74.006], // Default NYC
  zoom = 12,
  interactive = true,
  className = "h-full w-full",
}: ProblemMapInnerProps) {
  // If center isn't explicitly supplied, use average of problems
  const mapCenter: [number, number] =
    problems.length > 0 && center[0] === 40.7128 && center[1] === -74.006
      ? [
          problems.reduce((acc, p) => acc + p.latitude, 0) / problems.length,
          problems.reduce((acc, p) => acc + p.longitude, 0) / problems.length,
        ]
      : center;

  return (
    <div className={`relative ${className} z-0`}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        className="h-full w-full rounded-xl overflow-hidden shadow-inner"
        style={{ minHeight: "300px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter center={mapCenter} zoom={zoom} />

        {problems.map((problem) => {
          const icon = createCustomIcon(problem.urgency);
          const isSelected = problem.id === selectedProblemId;

          return (
            <Marker
              key={problem.id}
              position={[problem.latitude, problem.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectProblem?.(problem.id),
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 max-w-xs">
                  <div className="flex items-center gap-1.5 mb-1">
                    <UrgencyBadge urgency={problem.urgency} />
                    <StatusBadge status={problem.status} />
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1">
                    {problem.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {problem.description}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 border-t pt-1.5">
                    <span>{problem.locationArea}</span>
                    <Link
                      href={`/problems/${problem.id}`}
                      className="font-semibold text-indigo-600 hover:underline"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
