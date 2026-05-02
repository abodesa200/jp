"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  overview: {
    totalUsers: number;
    totalDrivers: number;
    totalRides: number;
    activeRides: number;
    completedRides: number;
    cancelledRides: number;
    pendingDrivers: number;
    onlineDrivers: number;
    totalRevenue: number;
  };
  recent: {
    rides: number;
    users: number;
    drivers: number;
  };
  topDrivers: any[];
  recentRides: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">Failed to load stats</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of your ride sharing platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.overview?.totalUsers}
          icon="👥"
          color="blue"
          change={`+${stats.recent.users} this week`}
        />
        <StatCard
          title="Total Drivers"
          value={stats.overview.totalDrivers}
          icon="🚗"
          color="green"
          change={`+${stats.recent.drivers} this week`}
        />
        <StatCard
          title="Total Rides"
          value={stats.overview.totalRides}
          icon="🗺️"
          color="purple"
          change={`+${stats.recent.rides} this week`}
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.overview.totalRevenue.toFixed(2)}`}
          icon="💰"
          color="yellow"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Rides"
          value={stats.overview.activeRides}
          icon="🔄"
          color="blue"
          small
        />
        <StatCard
          title="Completed Rides"
          value={stats.overview.completedRides}
          icon="✅"
          color="green"
          small
        />
        <StatCard
          title="Online Drivers"
          value={stats.overview.onlineDrivers}
          icon="🟢"
          color="green"
          small
        />
        <StatCard
          title="Pending Drivers"
          value={stats.overview.pendingDrivers}
          icon="⏳"
          color="orange"
          small
          link="/admin/pending-drivers"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Drivers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🏆 Top Drivers</h2>
          <div className="space-y-3">
            {stats.topDrivers.map((driver, index) => (
              <div
                key={driver.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">
                      {driver.user.name || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {driver.totalRides} rides
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600">
                    ⭐ {driver.rating.toFixed(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Rides */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">📋 Recent Rides</h2>
            <Link
              href="/admin/rides"
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentRides.slice(0, 5).map((ride) => (
              <div
                key={ride.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-semibold text-sm">
                    {ride.client.name || "Unknown"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(ride.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={ride.status} />
                  <div className="text-sm font-semibold mt-1">
                    ${ride.fare?.toFixed(2) || "N/A"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  change,
  small,
  link,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  change?: string;
  small?: boolean;
  link?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-yellow-50 text-yellow-600",
    orange: "bg-orange-50 text-orange-600",
  };

  const content = (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className={`${small ? "text-2xl" : "text-3xl"} font-bold mt-2`}>
            {value}
          </p>
          {change && <p className="text-sm text-green-600 mt-2">📈 {change}</p>}
        </div>
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${colorClasses[color as keyof typeof colorClasses]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }

  return content;
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
