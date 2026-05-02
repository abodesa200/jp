"use client";

import Link from "next/link";
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
  user: {
    id: number;
    phone: string;
    name: string | null;
    email: string | null;
    isVerified: boolean;
  };
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [approvedFilter, setApprovedFilter] = useState<string>("");

  useEffect(() => {
    fetchDrivers();
  }, [page, approvedFilter]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        role: "DRIVER",
        ...(approvedFilter && { approved: approvedFilter }),
      });

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setDrivers(data.users);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/admin/drivers/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ isApproved: !currentStatus }),
      });
      fetchDrivers();
    } catch (error) {
      console.error("Error updating driver:", error);
    }
  };

  const deleteDriver = async (id: string) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;

    try {
      await fetch(`/api/admin/drivers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchDrivers();
    } catch (error) {
      console.error("Error deleting driver:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600 mt-1">Manage all platform drivers</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Add Driver
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={approvedFilter}
              onChange={(e) => {
                setApprovedFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Drivers</option>
              <option value="true">Approved</option>
              <option value="false">Pending</option>
            </select>
          </div>
          <div className="flex-1"></div>
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold">{total}</span> drivers
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                License
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rides
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : drivers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No drivers found
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">
                        {driver.user.name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {driver.isOnline ? "🟢 Online" : "⚪ Offline"}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{driver.user.phone}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium">{driver.carModel}</div>
                      <div className="text-gray-500">{driver.carPlate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{driver.licenseNumber}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-semibold">
                        {driver.rating.toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{driver.totalRides}</td>
                  <td className="px-6 py-4 text-sm">
                    {driver.isApproved ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        Approved
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/drivers/${driver.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                      <button
                        onClick={() =>
                          toggleApproval(driver.id, driver.isApproved)
                        }
                        className="text-green-600 hover:underline"
                      >
                        {driver.isApproved ? "Revoke" : "Approve"}
                      </button>
                      <button
                        onClick={() => deleteDriver(driver.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {Math.ceil(total / 20)}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= Math.ceil(total / 20)}
          className="px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
