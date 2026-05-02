"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Driver {
  id: string;
  licenseNumber: string;
  carModel: string;
  carPlate: string;
  carColor: string | null;
  carYear: number | null;
  isApproved: boolean;
  isOnline: boolean;
  rating: number;
  totalRides: number;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  user: {
    id: number;
    phone: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
    createdAt: string;
  };
}

export default function DriverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriver();
  }, []);

  const fetchDriver = async () => {
    try {
      const res = await fetch(`/api/admin/drivers/${params.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setDriver(data.driver);
    } catch (error) {
      console.error("Error fetching driver:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async () => {
    if (!driver) return;

    try {
      await fetch(`/api/admin/drivers/${driver.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ isApproved: !driver.isApproved }),
      });
      fetchDriver();
    } catch (error) {
      console.error("Error updating driver:", error);
    }
  };

  const deleteDriver = async () => {
    if (!confirm("Are you sure you want to delete this driver?")) return;

    try {
      await fetch(`/api/admin/drivers/${params.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      router.push("/admin/drivers");
    } catch (error) {
      console.error("Error deleting driver:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!driver) {
    return (
      <div className="text-center py-12 text-red-600">Driver not found</div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/drivers"
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {driver.user.name || "Unknown Driver"}
            </h1>
            <p className="text-gray-600 mt-1">Driver Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleApproval}
            className={`px-4 py-2 rounded-lg font-semibold ${
              driver.isApproved
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {driver.isApproved ? "Revoke Approval" : "Approve Driver"}
          </button>
          <button
            onClick={deleteDriver}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Status</div>
          <div className="text-2xl font-bold mt-1">
            {driver.isApproved ? (
              <span className="text-green-600">✓ Approved</span>
            ) : (
              <span className="text-yellow-600">⏳ Pending</span>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Online Status</div>
          <div className="text-2xl font-bold mt-1">
            {driver.isOnline ? (
              <span className="text-green-600">🟢 Online</span>
            ) : (
              <span className="text-gray-400">⚪ Offline</span>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Rating</div>
          <div className="text-2xl font-bold mt-1">
            ⭐ {driver.rating.toFixed(1)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Rides</div>
          <div className="text-2xl font-bold mt-1">{driver.totalRides}</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">👤 Personal Information</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Full Name</div>
              <div className="font-semibold">{driver.user.name || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Phone Number</div>
              <div className="font-semibold">{driver.user.phone}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Email</div>
              <div className="font-semibold">{driver.user.email || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Verified</div>
              <div className="font-semibold">
                {driver.user.isVerified ? (
                  <span className="text-green-600">✓ Yes</span>
                ) : (
                  <span className="text-gray-400">✗ No</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Member Since</div>
              <div className="font-semibold">
                {new Date(driver.user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🚗 Vehicle Information</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Car Model</div>
              <div className="font-semibold">{driver.carModel}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">License Plate</div>
              <div className="font-semibold font-mono">{driver.carPlate}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Color</div>
              <div className="font-semibold">{driver.carColor || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Year</div>
              <div className="font-semibold">{driver.carYear || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">License Number</div>
              <div className="font-semibold font-mono">
                {driver.licenseNumber}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      {driver.latitude && driver.longitude && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">📍 Current Location</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Latitude</div>
              <div className="font-mono font-semibold">
                {driver.latitude.toFixed(6)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Longitude</div>
              <div className="font-mono font-semibold">
                {driver.longitude.toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">📊 Activity Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Total Rides Completed</span>
            <span className="font-bold">{driver.totalRides}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Average Rating</span>
            <span className="font-bold">⭐ {driver.rating.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="text-gray-600">Account Created</span>
            <span className="font-bold">
              {new Date(driver.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
