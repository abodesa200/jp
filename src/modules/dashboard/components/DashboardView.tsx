"use client";

import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { RecentRidesList } from "./RecentRidesList";
import { StatsGrid } from "./StatsGrid";
import { TopDriversList } from "./TopDriversList";

export function DashboardView() {
    const { stats, loading, error, refetch } = useDashboardStats();

    if (loading) return <LoadingPage />;

    if (error || !stats) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Overview of your ride sharing platform</p>
                </div>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Failed to load dashboard</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>{error || "An unexpected error occurred"}</span>
                        <Button variant="outline" size="sm" onClick={refetch} className="ml-4">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{greeting} 👋</h1>
                    <p className="text-muted-foreground mt-1">
                        Here&apos;s what&apos;s happening on your platform today.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={refetch}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <StatsGrid stats={stats} />

            <div className="grid gap-6 lg:grid-cols-2">
                <TopDriversList drivers={stats.topDrivers} />
                <RecentRidesList rides={stats.recentRides} />
            </div>
        </div>
    );
}
