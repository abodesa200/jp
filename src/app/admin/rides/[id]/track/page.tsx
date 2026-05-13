"use client";

import { useSocket } from "@/app/hooks/useSocket";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Loader2, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const AdminRideMap = dynamic(() => import("@/components/AdminRideMap"), {
  ssr: false,
});

interface Ride {
  id: number;
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
    id: number;
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
  const params = useParams<{ id: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [adminUserId, setAdminUserId] = useState<string>("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setAdminUserId(String(user.id));
    }
  }, []);

  const { socket, isConnected } = useSocket({
    userId: adminUserId,
    role: "ADMIN",
    autoConnect: !!adminUserId,
  });

  useEffect(() => {
    void fetchRide();
  }, [params.id]);

  useEffect(() => {
    if (!socket || !ride) return;
    socket.emit("ride:join", { rideId: ride.id });
  }, [socket, ride]);

  useEffect(() => {
    if (!socket) return;

    const handleLocation = (data: { lat: number; lng: number }) => {
      setDriverLocation({ lat: data.lat, lng: data.lng });
    };

    const handleStatusUpdate = (data: { ride?: Ride }) => {
      if (data.ride) setRide(data.ride);
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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/rides/${params.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch ride");
      setRide(data.ride);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ride");
    } finally {
      setLoading(false);
    }
  };

  const updateRideStatus = async (status: string) => {
    if (!ride) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/rides/${ride.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update ride status");

      setRide(data.ride);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update ride status");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!ride) {
    return <div className="text-center py-12 text-red-600">Ride not found</div>;
  }

  const showActions = ride.driver && !["COMPLETED", "CANCELLED"].includes(ride.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/rides">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Track Ride #{ride.id}</h1>
            <p className="text-muted-foreground mt-1">Real-time ride tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={ride.status} />
          <Badge variant={isConnected ? "default" : "outline"}>{isConnected ? "Live" : "Offline"}</Badge>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Live Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] rounded-lg overflow-hidden border">
              <AdminRideMap
                pickup={{ lat: ride.pickupLat, lng: ride.pickupLng }}
                dropoff={{ lat: ride.dropoffLat, lng: ride.dropoffLng }}
                driverLocation={driverLocation}
                editable={false}
              />
            </div>
            {driverLocation && (
              <div className="mt-3 text-sm text-muted-foreground">
                Driver Location: {driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Client</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Name:</span> {ride.client.name || "Unknown"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {ride.client.phone}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Driver</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {ride.driver ? (
                <>
                  <div><span className="text-muted-foreground">Name:</span> {ride.driver.user.name || "Unknown"}</div>
                  <div><span className="text-muted-foreground">Phone:</span> {ride.driver.user.phone}</div>
                  <div><span className="text-muted-foreground">Vehicle:</span> {ride.driver.carModel} ({ride.driver.carPlate})</div>
                </>
              ) : (
                <div className="text-muted-foreground">No driver assigned</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Ride Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Type:</span> {ride.type}</div>
              <div><span className="text-muted-foreground">Distance:</span> {ride.distance ? `${ride.distance.toFixed(1)} km` : "-"}</div>
              <div><span className="text-muted-foreground">Fare:</span> {ride.fare ? `$${ride.fare.toFixed(2)}` : "-"}</div>
            </CardContent>
          </Card>

          {showActions && (
            <Card>
              <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {ride.status === "ACCEPTED" && (
                  <Button className="w-full" disabled={actionLoading} onClick={() => updateRideStatus("IN_PROGRESS")}>
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Ride"}
                  </Button>
                )}
                {ride.status === "IN_PROGRESS" && (
                  <Button className="w-full" disabled={actionLoading} onClick={() => updateRideStatus("COMPLETED")}>
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete Ride"}
                  </Button>
                )}
                <Button variant="destructive" className="w-full" disabled={actionLoading} onClick={() => updateRideStatus("CANCELLED")}>
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel Ride"}
                </Button>
              </CardContent>
            </Card>
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
    DRIVER_ARRIVED: "bg-indigo-100 text-indigo-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${colors[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
