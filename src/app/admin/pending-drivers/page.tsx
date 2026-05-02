"use client";

import { useEffect, useState } from "react";

interface Driver {
  id: string;
  licenseNumber: string;
  carModel: string;
  carPlate: string;
  carColor: string | null;
  carYear: number | null;
  createdAt: string;
  user: {
    id: number;
    phone: string;
    name: string | null;
    email: string | null;
  };
}

export default function PendingDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingDrivers();
  }, []);

  const fetchPendingDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/drivers?approved=false&limit=100", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setDrivers(data.drivers);
    } catch (error) {
      console.error("Error fetching pending drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveDriver = async (id: string) => {
    try {
      await fetch(`/api/admin/drivers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ isApproved: true }),
      });
      fetchPendingDrivers();
    } catch (error) {
      console.error("Error approving driver:", error);
    }
  };

  const rejectDriver = async (id: string) => {
    if (!confirm("Are you sure you want to reject this driver?")) return;

    try {
      await fetch(`/api/admin/drivers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchPendingDrivers();
    } catch (error) {
      console.error("Error rejecting driver:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pending Drivers</h1>
        <p className="text-gray-600 mt-1">
          Review and approve driver applications
        </p>
      </div>

      {/* Stats */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏳</span>
          <div>
            <div className="font-semibold text-yellow-900">
              {drivers.length} Pending Applications
            </div>
            <div className="text-sm text-yellow-700">
              Waiting for your review
            </div>
          </div>
        </div>
      </div>

      {/* Drivers Grid */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : drivers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            All Caught Up!
          </h3>
          <p className="text-gray-600">
            No pending driver applications at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="bg-white rounded-lg shadow-lg p-6 border-2 border-yellow-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {driver.user.name || "Unknown Driver"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Applied {new Date(driver.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                  PENDING
                </span>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">📱</span>
                  <span>{driver.user.phone}</span>
                </div>
                {driver.user.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">📧</span>
                    <span>{driver.user.email}</span>
                  </div>
                )}
              </div>

              {/* Vehicle Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">
                  🚗 Vehicle Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">Model</div>
                    <div className="font-semibold">{driver.carModel}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Plate</div>
                    <div className="font-semibold">{driver.carPlate}</div>
                  </div>
                  {driver.carColor && (
                    <div>
                      <div className="text-gray-500">Color</div>
                      <div className="font-semibold">{driver.carColor}</div>
                    </div>
                  )}
                  {driver.carYear && (
                    <div>
                      <div className="text-gray-500">Year</div>
                      <div className="font-semibold">{driver.carYear}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* License */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">
                  🪪 License Number
                </h4>
                <div className="font-mono font-semibold">
                  {driver.licenseNumber}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => approveDriver(driver.id)}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => rejectDriver(driver.id)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
