"use client";

import { useSocket } from "@/app/hooks/useSocket";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const AdminRideMap = dynamic(() => import("@/components/AdminRideMap"), {
  ssr: false,
});

interface Ride {
  id: string | number;
  status: string;
  type: string;
  fare: number | null;
  distance: number | null;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string | null;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string | null;
  requestedAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  client: {
    id: number;
    name: string | null;
    phone: string;
  };
  driver: {
    id: string;
    user: {
      id: number;
      name: string | null;
      phone: string;
    };
    carModel: string;
    carPlate: string;
  } | null;
}

export default function TrackRidePage() {
  const params = useParams();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Get admin user from localStorage
  const [adminUserId, setAdminUserId] = useState<string>("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    console.log("userStr", userStr)
    if (userStr) {
      const user = JSON.parse(userStr);
      setAdminUserId(user.id.toString());
    }
  }, []);

  // Connect to socket
  const { socket, isConnected } = useSocket({
    userId: adminUserId,
    role: "ADMIN",
    autoConnect: !!adminUserId,
  });

  useEffect(() => {
    fetchRide();
  }, []);

  // Join ride room when socket connects and ride is loaded
  useEffect(() => {
    if (!socket || !ride) return;

    socket.emit("ride:join", { rideId: ride.id });
    console.log(`📍 Admin joined ride room: ${ride.id}`);
  }, [socket, ride?.id]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for driver location updates
    const handleLocation = (data: any) => {
      console.log("📍 Driver location update:", data);
      setDriverLocation({
        lat: data.lat,
        lng: data.lng,
      });
    };

    // Listen for ride status updates
    const handleStatusUpdate = (data: any) => {
      console.log("🔄 Ride status update:", data);
      if (data.ride) {
        setRide(data.ride);
      }
    };

    socket.on("ride:location", handleLocation);
    socket.on("ride:accepted", handleStatusUpdate);
    socket.on("ride:in_progress", handleStatusUpdate);
    socket.on("ride:completed", handleStatusUpdate);
    socket.on("ride:cancelled", handleStatusUpdate);

    return () => {
      socket.off("ride:location", handleLocation);
      socket.off("ride:accepted", handleStatusUpdate);
      socket.off("ride:in_progress", handleStatusUpdate);
      socket.off("ride:completed", handleStatusUpdate);
      socket.off("ride:cancelled", handleStatusUpdate);
    };
  }, [socket]);

  const fetchRide = async () => {
    try {
      const res = await fetch(`/api/admin/rides/${params.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setRide(data.ride);
    } catch (error) {
      console.error("Error fetching ride:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRideStatus = async (status: string) => {
    if (!ride) return;

    try {
      const res = await fetch(`/api/rides/${ride.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchRide();
      }
    } catch (error) {
      console.error("Error updating ride:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!ride) {
    return <div className="text-center py-12 text-red-600">Ride not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/rides"
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Track Ride #{ride.id.toString().slice(0, 8)}
            </h1>
            <p className="text-gray-600 mt-1">Real-time ride tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={ride.status} />
          {isConnected ? (
            <span className="text-sm text-green-600">🟢 Live</span>
          ) : (
            <span className="text-sm text-gray-400">⚪ Offline</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📍 Live Map</h2>
          <div className="h-[600px] rounded-lg overflow-hidden">
            <AdminRideMap
              pickup={{ lat: ride.pickupLat, lng: ride.pickupLng }}
              dropoff={{ lat: ride.dropoffLat, lng: ride.dropoffLng }}
              driverLocation={driverLocation}
              editable={false}
            />
          </div>
          {driverLocation && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-semibold text-blue-900">
                🚗 Driver Location (Live)
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Lat: {driverLocation.lat.toFixed(6)}, Lng:{" "}
                {driverLocation.lng.toFixed(6)}
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Client Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4">👤 Client</h3>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-gray-600">Name</div>
                <div className="font-semibold">
                  {ride.client.name || "Unknown"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div className="font-semibold">{ride.client.phone}</div>
              </div>
            </div>
          </div>

          {/* Driver Info */}
          {ride.driver ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold mb-4">🚗 Driver</h3>
              <div className="space-y-2">
                <div>
                  <div className="text-sm text-gray-600">Name</div>
                  <div className="font-semibold">
                    {ride.driver.user.name || "Unknown"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="font-semibold">{ride.driver.user.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Vehicle</div>
                  <div className="font-semibold">
                    {ride.driver.carModel} ({ride.driver.carPlate})
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="text-yellow-800 font-semibold">
                ⏳ No Driver Assigned
              </div>
              <div className="text-sm text-yellow-700 mt-1">
                Waiting for a driver to accept
              </div>
            </div>
          )}

          {/* Ride Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4">📋 Ride Details</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <StatusBadge status={ride.status} />
              </div>
              <div>
                <div className="text-sm text-gray-600">Type</div>
                <div className="font-semibold">{ride.type}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Distance</div>
                <div className="font-semibold">
                  {ride.distance ? `${ride.distance.toFixed(1)} km` : "—"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Fare</div>
                <div className="font-semibold text-lg">
                  {ride.fare ? `$${ride.fare.toFixed(2)}` : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold mb-4">📍 Locations</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Pickup</div>
                <div className="text-sm font-semibold">
                  {ride.pickupAddress || "No address"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {ride.pickupLat.toFixed(4)}, {ride.pickupLng.toFixed(4)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Dropoff</div>
                <div className="text-sm font-semibold">
                  {ride.dropoffAddress || "No address"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {ride.dropoffLat.toFixed(4)}, {ride.dropoffLng.toFixed(4)}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {ride.driver &&
            ride.status !== "COMPLETED" &&
            ride.status !== "CANCELLED" && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold mb-4">⚡ Quick Actions</h3>
                <div className="space-y-2">
                  {ride.status === "ACCEPTED" && (
                    <button
                      onClick={() => updateRideStatus("IN_PROGRESS")}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Start Ride
                    </button>
                  )}
                  {ride.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => updateRideStatus("COMPLETED")}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Complete Ride
                    </button>
                  )}
                  <button
                    onClick={() => updateRideStatus("CANCELLED")}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Cancel Ride
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    REQUESTED: "bg-blue-100 text-blue-800",
    ACCEPTED: "bg-green-100 text-green-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${colors[status] || "bg-gray-100 text-gray-800"}`}
    >
      {status}
    </span>
  );
}
