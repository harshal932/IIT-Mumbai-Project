"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

export type PermissionStatus = "prompt" | "granted" | "denied" | "unsupported";

interface LocationContextType {
  userLocation: UserLocation | null;
  permissionStatus: PermissionStatus;
  isMonitoring: boolean;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  requestLocationPermission: () => Promise<boolean>;
  stopMonitoring: () => void;
  triggerLoginLocationPrompt: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const PERMISSION_STORAGE_KEY = "localloop_location_permission";
const LOCATION_STORAGE_KEY = "localloop_cached_location";

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("prompt");
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Load cached status on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!navigator.geolocation) {
      setPermissionStatus("unsupported");
      return;
    }

    const storedPermission = localStorage.getItem(PERMISSION_STORAGE_KEY) as PermissionStatus | null;
    const storedLoc = localStorage.getItem(LOCATION_STORAGE_KEY);

    if (storedLoc) {
      try {
        const parsed = JSON.parse(storedLoc);
        setUserLocation(parsed);
      } catch {
        // ignore invalid cached location
      }
    }

    if (storedPermission === "granted") {
      setPermissionStatus("granted");
      startWatchingLocation();
    } else if (storedPermission === "denied") {
      setPermissionStatus("denied");
    }

    const triggerPrompt = localStorage.getItem("localloop_trigger_location_prompt");
    if (triggerPrompt === "true") {
      localStorage.removeItem("localloop_trigger_location_prompt");
      if (storedPermission !== "granted") {
        setShowModal(true);
      }
    }
  }, []);

  const startWatchingLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    setIsMonitoring(true);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: UserLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setUserLocation(loc);
        setPermissionStatus("granted");
        localStorage.setItem(PERMISSION_STORAGE_KEY, "granted");
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
      },
      (err) => {
        console.warn("Geolocation watch error:", err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionStatus("denied");
          localStorage.setItem(PERMISSION_STORAGE_KEY, "denied");
        }
        setIsMonitoring(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    setWatchId(id);
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setPermissionStatus("unsupported");
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: UserLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          };
          setUserLocation(loc);
          setPermissionStatus("granted");
          localStorage.setItem(PERMISSION_STORAGE_KEY, "granted");
          localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
          setShowModal(false);
          startWatchingLocation();
          resolve(true);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setPermissionStatus("denied");
            localStorage.setItem(PERMISSION_STORAGE_KEY, "denied");
          }
          setShowModal(false);
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, [startWatchingLocation]);

  const stopMonitoring = useCallback(() => {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsMonitoring(false);
  }, [watchId]);

  const triggerLoginLocationPrompt = useCallback(() => {
    const storedPermission = localStorage.getItem(PERMISSION_STORAGE_KEY);
    if (storedPermission !== "granted") {
      setShowModal(true);
    } else {
      startWatchingLocation();
    }
  }, [startWatchingLocation]);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        permissionStatus,
        isMonitoring,
        showModal,
        setShowModal,
        requestLocationPermission,
        stopMonitoring,
        triggerLoginLocationPrompt,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
