"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Ride {
  id: string;
  status: string;
  type: string;
  fare: number | null;
  distance: number | null;
  createdAt: string;
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
  } | null;
}

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchRides();
  }, [page, statusFilter]);

  const fetchRides = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(statusFilter && { status: statusFilter }),
      });

      const res = await fetch(`/api/admin/rides?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setRides(data.rides);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error("Error fetching rides:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRide = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ride?")) return;

    try {
      await fetch(`/api/admin/rides/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchRides();
    } catch (error) {
      console.error("Error deleting ride:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rides</h1>
          <p className="text-gray-600 mt-1">Manage all platform rides</p>
        </div>
        <Link
          href="/admin/rides/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          + Create Ride
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Statuses</option>
              <option value="REQUESTED">Requested</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="flex-1"></div>
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold">{total}</span> rides
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Distance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fare
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : rides.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  No rides found
                </td>
              </tr>
            ) : (
              rides.map((ride) => (
                <tr key={ride.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">
                    {ride.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <div className="font-medium">
                        {ride.client.name || "Unknown"}
                      </div>
                      <div className="text-gray-500">{ride.client.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {ride.driver ? (
                      <div>
                        <div className="font-medium">
                          {ride.driver.user.name || "Unknown"}
                        </div>
                        <div className="text-gray-500">
                          {ride.driver.user.phone}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No driver</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <TypeBadge type={ride.type} />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {ride.distance ? `${ride.distance.toFixed(1)} km` : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    {ride.fare ? `$${ride.fare.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <StatusBadge status={ride.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(ride.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/rides/${ride.id}/track`}
                        className="text-blue-600 hover:underline"
                      >
                        Track
                      </Link>
                      <Link
                        href={`/admin/rides/${ride.id}`}
                        className="text-green-600 hover:underline"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => deleteRide(ride.id)}
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
      className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-800"}`}
    >
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    STANDARD: "bg-blue-100 text-blue-800",
    CARPOOLING: "bg-purple-100 text-purple-800",
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[type] || "bg-gray-100 text-gray-800"}`}
    >
      {type}
    </span>
  );
}
