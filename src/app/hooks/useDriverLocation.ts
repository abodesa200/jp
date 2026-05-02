"use client";

import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

interface UseDriverLocationOptions {
  socket: Socket | null;
  rideId: string;
  enabled: boolean;
  intervalMs?: number;
}

export function useDriverLocation({
  socket,
  rideId,
  enabled,
  intervalMs = 3000, // 3 seconds default
}: UseDriverLocationOptions) {
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!socket || !enabled || !rideId) return;

    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser");
      return;
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Emit location to server
        socket.emit("driver:location", {
          rideId,
          lat: latitude,
          lng: longitude,
        });

        console.log(`📍 Location sent: ${latitude}, ${longitude}`);
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [socket, rideId, enabled, intervalMs]);
}
