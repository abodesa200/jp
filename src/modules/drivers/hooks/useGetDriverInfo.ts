import { useQuery } from "@tanstack/react-query";
import type { Driver } from "../types";

async function fetchDriverInfo(driverId: number): Promise<Driver> {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/drivers/${driverId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch driver info");
    }

    // return res.json();
    const data = await res.json();
return data.driver;
}

export default function useGetDriverInfo(driverId: number) {
    return useQuery({
        queryKey: ["driver", driverId],
        queryFn: () => fetchDriverInfo(driverId),
        staleTime: 30000,
    });
}
