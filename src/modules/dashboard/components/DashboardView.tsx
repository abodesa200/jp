"use client";

import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { RecentRidesList } from "./RecentRidesList";
import { StatsGrid } from "./StatsGrid";
import { TopDriversList } from "./TopDriversList";

export function DashboardView() {
    const { stats, loading, error } = useDashboardStats();

    if (loading) {
        return <LoadingPage />;
    }

    if (error || !stats) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Dashboard"
                    description="Overview of your ride sharing platform"
                />
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {error || "Failed to load dashboard data"}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title="Dashboard"
                description="Overview of your ride sharing platform"
            />

            <StatsGrid stats={stats} />

            <div className="grid gap-6 lg:grid-cols-2">
                <TopDriversList drivers={stats.topDrivers} />
                <RecentRidesList rides={stats.recentRides} />
            </div>
        </div>
    );
}
