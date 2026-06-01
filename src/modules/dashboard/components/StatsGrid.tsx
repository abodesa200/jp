"use client";

import { StatCard } from "@/components/shared/StatCard";
import {
    Activity,
    Car,
    CheckCircle,
    Clock,
    DollarSign,
    MapPin,
    Radio,
    Users,
} from "lucide-react";
import { DashboardStats } from "../types";

interface StatsGridProps {
    stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
    return (
        <div className="space-y-6">
            {/* Primary Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={stats?.overview?.totalUsers}
                    icon={Users}
                    variant="primary"
                    trend={{
                        value: stats?.recent?.users,
                        label: "this week",
                    }}
                />
                <StatCard
                    title="Total Drivers"
                    value={stats?.overview?.totalDrivers}
                    icon={Car}
                    variant="success"
                    trend={{
                        value: stats?.recent?.drivers,
                        label: "this week",
                    }}
                />
                <StatCard
                    title="Total Rides"
                    value={stats?.overview?.totalRides}
                    icon={MapPin}
                    variant="default"
                    trend={{
                        value: stats?.recent?.rides,
                        label: "this week",
                    }}
                />
                <StatCard
                    title="Total Revenue"
                    value={`$${Number(stats?.overview?.totalRevenue ?? 0).toFixed(2)}`} icon={DollarSign}
                    variant="warning"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Active Rides"
                    value={stats?.overview?.activeRides}
                    icon={Activity}
                    variant="primary"
                />
                <StatCard
                    title="Completed Rides"
                    value={stats?.overview?.completedRides}
                    icon={CheckCircle}
                    variant="success"
                />
                <StatCard
                    title="Online Drivers"
                    value={stats?.overview?.onlineDrivers}
                    icon={Radio}
                    variant="success"
                />
                <StatCard
                    title="Pending Drivers"
                    value={stats?.overview?.pendingDrivers}
                    icon={Clock}
                    variant="warning"
                    href="/admin/pending-drivers"
                />
            </div>
        </div>
    );
}
