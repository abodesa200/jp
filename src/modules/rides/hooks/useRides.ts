"use client";

import { useEffect, useState } from "react";
import { RidesService } from "../services/rides.service";
import { Ride, RidesListParams } from "../types";

export function useRides(initialParams: RidesListParams = {}) {
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [params, setParams] = useState<RidesListParams>(initialParams);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    useEffect(() => {
        fetchRides();
    }, [params]);

    const fetchRides = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await RidesService.getRides(params);
            setRides(data.rides);
            setPagination(data.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch rides");
        } finally {
            setLoading(false);
        }
    };

    const updateParams = (newParams: Partial<RidesListParams>) => {
        setParams((prev) => ({ ...prev, ...newParams }));
    };

    const deleteRide = async (id: number) => {
        try {
            await RidesService.deleteRide(id);
            await fetchRides();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete ride");
        }
    };

    return {
        rides,
        loading,
        error,
        pagination,
        params,
        updateParams,
        deleteRide,
        refetch: fetchRides,
    };
}
