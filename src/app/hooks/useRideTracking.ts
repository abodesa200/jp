"use client";

import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  timestamp: number;
}

interface RideUpdate {
  ride: any;
}

interface UseRideTrackingOptions {
  socket: Socket | null;
  rideId: string;
}

export function useRideTracking({ socket, rideId }: UseRideTrackingOptions) {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(
    null,
  );
  const [rideStatus, setRideStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!socket || !rideId) return;

    // Join ride room
    socket.emit("ride:join", { rideId });
    console.log(`📍 Joined ride room: ${rideId}`);

    // Listen for driver location updates
    const handleLocation = (data: DriverLocation) => {
      setDriverLocation(data);
    };

    // Listen for ride status updates
    const handleAccepted = (data: RideUpdate) => {
      setRideStatus("ACCEPTED");
      console.log("✅ Ride accepted:", data.ride);
    };

    const handleStarted = (data: RideUpdate) => {
      setRideStatus("IN_PROGRESS");
      console.log("🚗 Ride started:", data.ride);
    };

    const handleCompleted = (data: RideUpdate) => {
      setRideStatus("COMPLETED");
      console.log("🏁 Ride completed:", data.ride);
    };

    const handleCancelled = (data: RideUpdate) => {
      setRideStatus("CANCELLED");
      console.log("❌ Ride cancelled:", data.ride);
    };

    // Register event listeners
    socket.on("ride:location", handleLocation);
    socket.on("ride:accepted", handleAccepted);
    socket.on("ride:in_progress", handleStarted);
    socket.on("ride:completed", handleCompleted);
    socket.on("ride:cancelled", handleCancelled);

    return () => {
      // Clean up listeners
      socket.off("ride:location", handleLocation);
      socket.off("ride:accepted", handleAccepted);
      socket.off("ride:in_progress", handleStarted);
      socket.off("ride:completed", handleCompleted);
      socket.off("ride:cancelled", handleCancelled);
    };
  }, [socket, rideId]);

  return {
    driverLocation,
    rideStatus,
  };
}
