"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { UrgencyBadge, StatusBadge } from "@/components/ui/badge";
import { haversineDistance } from "@/lib/utils/geo";
import type { ProblemPublic } from "@/lib/types";

// Import Leaflet CSS directly
import "leaflet/dist/leaflet.css";

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

function createUserLocationIcon() {
  const svgHtml = `
    <div style="position:relative; width:24px; height:24px;">
      <span style="position:relative; display:block; width:18px; height:18px; margin:3px; border-radius:50%; background:#4f46e5; border:3px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4);"></span>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: "custom-user-location-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
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

export interface ProblemMapInnerProps {
  problems: ProblemPublic[];
  selectedProblemId?: string;
  onSelectProblem?: (id: string) => void;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  className?: string;
  userLocation?: [number, number] | null;
  scanCenter?: [number, number] | null;
  scanLabel?: string;
  perimeterKm?: number;
  showPerimeterCircle?: boolean;
}

export default function ProblemMapInner({
  problems,
  selectedProblemId,
  onSelectProblem,
  center = [40.7128, -74.006], // Default NYC
  zoom = 12,
  interactive = true,
  className = "h-full w-full",
  userLocation = null,
  scanCenter = null,
  scanLabel,
  perimeterKm = 5,
  showPerimeterCircle = true,
}: ProblemMapInnerProps) {
  // Determine primary active center: scanCenter > userLocation > center prop
  const activeCenter: [number, number] = scanCenter
    ? scanCenter
    : userLocation
    ? userLocation
    : problems.length > 0 && center[0] === 40.7128 && center[1] === -74.006
    ? [
        problems.reduce((acc, p) => acc + p.latitude, 0) / problems.length,
        problems.reduce((acc, p) => acc + p.longitude, 0) / problems.length,
      ]
    : center;

  return (
    <div className={`relative ${className} z-0`}>
      <MapContainer
        center={activeCenter}
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

        <MapRecenter center={activeCenter} zoom={zoom} />

        {/* 5km Radius Perimeter Circle around Active Center */}
        {showPerimeterCircle && (
          <Circle
            center={activeCenter}
            radius={perimeterKm * 1000}
            pathOptions={{
              color: "#6366f1",
              fillColor: "#818cf8",
              fillOpacity: 0.14,
              weight: 2,
              dashArray: "6, 6",
            }}
          />
        )}

        {/* User Location Marker (if user GPS available) */}
        {userLocation && (
          <Marker position={userLocation} icon={createUserLocationIcon()}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1.5 text-center">
                <p className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                  🎯 Your Realtime GPS Location
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Live position ({userLocation[0].toFixed(3)}°, {userLocation[1].toFixed(3)}°)
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Problem Markers */}
        {problems.map((problem) => {
          const icon = createCustomIcon(problem.urgency);
          const isSelected = problem.id === selectedProblemId;

          const distKm = haversineDistance(
            activeCenter[0],
            activeCenter[1],
            problem.latitude,
            problem.longitude
          );

          return (
            <Marker
              key={problem.id}
              position={[problem.latitude, problem.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectProblem?.(problem.id),
              }}
            >
              <Popup className="custom-leaflet-popup" autoPan={isSelected}>
                <div className="p-1 max-w-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <UrgencyBadge urgency={problem.urgency} />
                      <StatusBadge status={problem.status} />
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {distKm.toFixed(1)} km away
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                    {problem.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
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
