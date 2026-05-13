"use client";

import { useEffect, useState } from "react";
import { ReportsService } from "../services/reports.service";
import { DriverStats, RevenueStats, RideStats, UserStats } from "../types";

export function useReports() {
    const [rideStats, setRideStats] = useState<RideStats | null>(null);
    const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
    const [driverStats, setDriverStats] = useState<DriverStats | null>(null);
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            setError(null);
            const [rides, revenue, drivers, users] = await Promise.all([
                ReportsService.getRideStats(),
                ReportsService.getRevenueStats(),
                ReportsService.getDriverStats(),
                ReportsService.getUserStats(),
            ]);
            setRideStats(rides);
            setRevenueStats(revenue);
            setDriverStats(drivers);
            setUserStats(users);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch reports");
        } finally {
            setLoading(false);
        }
    };

    return {
        rideStats,
        revenueStats,
        driverStats,
        userStats,
        loading,
        error,
        refetch: fetchAll,
    };
}
