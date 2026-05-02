"use client";

import { useRideTracking } from "@/app/hooks/useRideTracking";
import { useSocket } from "@/app/hooks/useSocket";

interface ClientRideTrackerProps {
  userId: string;
  rideId: string;
}

export function ClientRideTracker({ userId, rideId }: ClientRideTrackerProps) {
  const { socket, isConnected } = useSocket({
    userId,
    role: "CLIENT",
  });

  const { driverLocation, rideStatus } = useRideTracking({
    socket,
    rideId,
  });

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Ride Tracking</h3>
      <div className="space-y-2">
        <div>Socket: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}</div>
        <div>
          Ride Status:{" "}
          <span className="font-semibold">{rideStatus || "PENDING"}</span>
        </div>
        {driverLocation && (
          <div className="mt-4 p-2 bg-gray-100 rounded">
            <div className="font-semibold">Driver Location:</div>
            <div>Lat: {driverLocation.lat.toFixed(6)}</div>
            <div>Lng: {driverLocation.lng.toFixed(6)}</div>
            <div className="text-xs text-gray-500">
              Updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
        {!driverLocation && rideStatus === "ACCEPTED" && (
          <div className="text-gray-500">Waiting for driver location...</div>
        )}
      </div>
    </div>
  );
}
