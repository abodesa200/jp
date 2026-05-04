import { useQuery } from "@tanstack/react-query";
import type { UsersFilters, UsersResponse } from "../types";

async function fetchUsers(filters: UsersFilters): Promise<UsersResponse> {
    const params = new URLSearchParams();

    params.append("page", String(filters.page ?? 1));
    params.append("limit", String(filters.limit ?? 20));

    if (filters.role) {
        params.append("role", filters.role);
    }

    if (filters.search) {
        params.append("search", filters.search);
    }

    const token = localStorage.getItem("token");
    const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        throw new Error("Failed to fetch users");
    }

    return res.json();
}

export default function useGetUsers(filters: UsersFilters) {
    return useQuery({
        queryKey: ["users", filters],
        queryFn: () => fetchUsers(filters),
        staleTime: 30000, // 30 seconds
    });
}