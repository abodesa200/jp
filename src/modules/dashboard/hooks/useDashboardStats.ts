"use client";

import { useEffect, useState } from "react";
import { DashboardService } from "../services/dashboard.service";
import { DashboardStats } from "../types";

export function useDashboardStats() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await DashboardService.getStats();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch stats");
        } finally {
            setLoading(false);
        }
    };

    return {
        stats,
        loading,
        error,
        refetch: fetchStats,
    };
}
