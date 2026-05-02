"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Import Map dynamically to avoid SSR issues
const AdminRideMap = dynamic(() => import("@/components/AdminRideMap"), {
  ssr: false,
});

interface User {
  id: number;
  name: string | null;
  phone: string;
}

interface Driver {
  id: string;
  user: User;
  carModel: string;
  carPlate: string;
  isOnline: boolean;
  isApproved: boolean;
}

export default function CreateRidePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // Form state
  const [clientId, setClientId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [pickupLat, setPickupLat] = useState(24.7136);
  const [pickupLng, setPickupLng] = useState(46.6753);
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffLat, setDropoffLat] = useState(24.7736);
  const [dropoffLng, setDropoffLng] = useState(46.7353);
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [rideType, setRideType] = useState("STANDARD");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchDrivers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users?role=CLIENT&limit=100", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await fetch("/api/admin/drivers?approved=true&limit=100", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setDrivers(data.drivers || []);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create ride as admin
      const res = await fetch("/api/admin/rides/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          clientId: parseInt(clientId),
          driverId: driverId || null,
          pickupLat,
          pickupLng,
          pickupAddress,
          dropoffLat,
          dropoffLng,
          dropoffAddress,
          type: rideType,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to create ride");
        return;
      }

      alert("Ride created successfully!");
      router.push(`/admin/rides/${data.ride.id}/track`);
    } catch (error) {
      console.error("Error creating ride:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (
    type: "pickup" | "dropoff",
    lat: number,
    lng: number,
  ) => {
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Ride</h1>
        <p className="text-gray-600 mt-1">
          Create and assign a ride to a client and driver
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Client (Passenger) *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select a client</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || "Unknown"} - {user.phone}
                  </option>
                ))}
              </select>
            </div>

            {/* Driver Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Driver (Optional)
              </label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">No driver (will be assigned later)</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.user.name || "Unknown"} - {driver.carModel} (
                    {driver.carPlate}) {driver.isOnline ? "🟢" : "⚪"}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to let drivers accept the ride
              </p>
            </div>

            {/* Pickup Location */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">📍 Pickup Location</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="e.g., King Fahd Road, Riyadh"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={pickupLat}
                      onChange={(e) => setPickupLat(parseFloat(e.target.value))}
                      required
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={pickupLng}
                      onChange={(e) => setPickupLng(parseFloat(e.target.value))}
                      required
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dropoff Location */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">🎯 Dropoff Location</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="e.g., King Khalid Airport"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={dropoffLat}
                      onChange={(e) =>
                        setDropoffLat(parseFloat(e.target.value))
                      }
                      required
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={dropoffLng}
                      onChange={(e) =>
                        setDropoffLng(parseFloat(e.target.value))
                      }
                      required
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ride Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Ride Type
              </label>
              <select
                value={rideType}
                onChange={(e) => setRideType(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="STANDARD">Standard</option>
                <option value="CARPOOLING">Carpooling</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Any special instructions..."
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Ride"}
            </button>
          </form>
        </div>

        {/* Map */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-4">📍 Select Locations on Map</h3>
          <p className="text-sm text-gray-600 mb-4">
            Click on the map to set pickup (green) and dropoff (red) locations
          </p>
          <div className="h-[600px] rounded-lg overflow-hidden">
            <AdminRideMap
              pickup={{ lat: pickupLat, lng: pickupLng }}
              dropoff={{ lat: dropoffLat, lng: dropoffLng }}
              onPickupChange={(lat, lng) => handleMapClick("pickup", lat, lng)}
              onDropoffChange={(lat, lng) =>
                handleMapClick("dropoff", lat, lng)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
