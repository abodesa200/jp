"use client";

import { useEffect, useState } from "react";
import { DriversService } from "../services/drivers.service";
import { Driver, DriversListParams } from "../types";

export function useDrivers(initialParams: DriversListParams = {}) {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [params, setParams] = useState<DriversListParams>(initialParams);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    useEffect(() => {
        fetchDrivers();
    }, [params]);

    const fetchDrivers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await DriversService.getDrivers(params);
            setDrivers(data.users);
            setPagination(data.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch drivers");
        } finally {
            setLoading(false);
        }
    };

    const updateParams = (newParams: Partial<DriversListParams>) => {
        setParams((prev) => ({ ...prev, ...newParams }));
    };

    const toggleApproval = async (id: string, currentStatus: boolean) => {
        try {
            await DriversService.toggleApproval(id, currentStatus);
            await fetchDrivers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update driver");
        }
    };

    const deleteDriver = async (id: string) => {
        try {
            await DriversService.deleteDriver(id);
            await fetchDrivers();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete driver");
        }
    };

    return {
        drivers,
        loading,
        error,
        pagination,
        params,
        updateParams,
        toggleApproval,
        deleteDriver,
        refetch: fetchDrivers,
    };
}
