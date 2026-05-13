"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AdminRideMap = dynamic(() => import("@/components/AdminRideMap"), {
  ssr: false,
});

interface User {
  id: number;
  name: string | null;
  phone: string;
}

interface Driver {
  id: number;
  user: User;
  carModel: string;
  carPlate: string;
  isOnline: boolean;
  isApproved: boolean;
}

export default function CreateRidePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [pickupLat, setPickupLat] = useState(33.5138);
  const [pickupLng, setPickupLng] = useState(36.2765);
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffLat, setDropoffLat] = useState(33.5238);
  const [dropoffLng, setDropoffLng] = useState(36.2865);
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [rideType, setRideType] = useState("STANDARD");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    void fetchUsers();
    void fetchDrivers();
  }, []);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users?role=CLIENT&limit=100", {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch users");
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const res = await fetch("/api/admin/drivers?isApproved=true&limit=100", {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch drivers");
      setDrivers(data.drivers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch drivers");
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/rides/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          clientId: Number(clientId),
          driverId: driverId ? Number(driverId) : undefined,
          pickupLat,
          pickupLng,
          pickupAddress: pickupAddress || undefined,
          dropoffLat,
          dropoffLng,
          dropoffAddress: dropoffAddress || undefined,
          type: rideType,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create ride");
      }

      router.push(`/admin/rides/${data.ride.id}/track`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (type: "pickup" | "dropoff", lat: number, lng: number) => {
    if (type === "pickup") {
      setPickupLat(lat);
      setPickupLng(lng);
    } else {
      setDropoffLat(lat);
      setDropoffLng(lng);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Ride</h1>
        <p className="text-muted-foreground mt-1">
          Create and assign a ride to a client and optionally a driver.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ride Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Client (Passenger) *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingUsers ? "Loading clients..." : "Select a client"} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name || "Unknown"} - {user.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Driver (Optional)</Label>
                <Select value={driverId || "none"} onValueChange={(value) => setDriverId(value === "none" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingDrivers ? "Loading drivers..." : "Select a driver"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No driver (assign later)</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={String(driver.id)}>
                        {driver.user.name || "Unknown"} - {driver.carModel} ({driver.carPlate})
                        {driver.isOnline ? " [Online]" : " [Offline]"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Pickup Address</Label>
                  <Input
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Enter pickup address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pickup Latitude *</Label>
                  <Input type="number" step="any" value={pickupLat} onChange={(e) => setPickupLat(Number(e.target.value))} required />
                </div>
                <div className="space-y-2">
                  <Label>Pickup Longitude *</Label>
                  <Input type="number" step="any" value={pickupLng} onChange={(e) => setPickupLng(Number(e.target.value))} required />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Dropoff Address</Label>
                  <Input
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    placeholder="Enter dropoff address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dropoff Latitude *</Label>
                  <Input type="number" step="any" value={dropoffLat} onChange={(e) => setDropoffLat(Number(e.target.value))} required />
                </div>
                <div className="space-y-2">
                  <Label>Dropoff Longitude *</Label>
                  <Input type="number" step="any" value={dropoffLng} onChange={(e) => setDropoffLng(Number(e.target.value))} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ride Type</Label>
                <Select value={rideType} onValueChange={setRideType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="CARPOOLING">Carpooling</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              </div>

              <Button type="submit" disabled={loading || !clientId || loadingUsers || loadingDrivers} className="w-full">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? "Creating..." : "Create Ride"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Select Locations on Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] rounded-lg overflow-hidden border">
              <AdminRideMap
                pickup={{ lat: pickupLat, lng: pickupLng }}
                dropoff={{ lat: dropoffLat, lng: dropoffLng }}
                onPickupChange={(lat, lng) => handleMapClick("pickup", lat, lng)}
                onDropoffChange={(lat, lng) => handleMapClick("dropoff", lat, lng)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
