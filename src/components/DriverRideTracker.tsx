"use client";

import { useDriverLocation } from "@/app/hooks/useDriverLocation";
import { useSocket } from "@/app/hooks/useSocket";
import { useEffect, useState } from "react";

interface DriverRideTrackerProps {
  userId: string;
  rideId: string;
  isActive: boolean; // Only track when ride is active
}

export function DriverRideTracker({
  userId,
  rideId,
  isActive,
}: DriverRideTrackerProps) {
  const { socket, isConnected } = useSocket({
    userId,
    role: "DRIVER",
  });

  const [isOnline, setIsOnline] = useState(false);

  // Track driver location when ride is active
  useDriverLocation({
    socket,
    rideId,
    enabled: isActive && isConnected,
    intervalMs: 3000, // Send location every 3 seconds
  });

  // Set driver online/offline
  useEffect(() => {
    if (!socket || !isConnected) return;

    if (isOnline) {
      socket.emit("driver:online");
    } else {
      socket.emit("driver:offline");
    }
  }, [socket, isConnected, isOnline]);

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Driver Status</h3>
      <div className="space-y-2">
        <div>Socket: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}</div>
        <div>Status: {isOnline ? "🟢 Online" : "🔴 Offline"}</div>
        <div>Location Tracking: {isActive ? "🟢 Active" : "⚪ Inactive"}</div>
        <button
          onClick={() => setIsOnline(!isOnline)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {isOnline ? "Go Offline" : "Go Online"}
        </button>
      </div>
    </div>
  );
}
