"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRides } from "../hooks/useRides";
import { RidesFilters } from "./RidesFilters";
import { RidesTable } from "./RidesTable";

export function RidesView() {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const { rides, loading, pagination, updateParams, deleteRide } = useRides({
        page: 1,
        limit: 20,
    });

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value);
        updateParams({
            page: 1,
            status: value === "all" ? undefined : (value as any),
        });
    };

    const handleTypeFilterChange = (value: string) => {
        setTypeFilter(value);
        updateParams({
            page: 1,
            type: value === "all" ? undefined : (value as any),
        });
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        updateParams({
            page: 1,
            search: value || undefined,
        });
    };

    const handlePageChange = (page: number) => {
        updateParams({ page });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Rides"
                description="Manage all platform rides"
                action={{
                    label: "Create Ride",
                    onClick: () => router.push("/admin/rides/create"),
                    icon: Plus,
                }}
            />

            <RidesFilters
                statusFilter={statusFilter}
                typeFilter={typeFilter}
                searchQuery={searchQuery}
                totalCount={pagination.total}
                onStatusFilterChange={handleStatusFilterChange}
                onTypeFilterChange={handleTypeFilterChange}
                onSearchChange={handleSearchChange}
            />

            <RidesTable
                rides={rides}
                loading={loading}
                pagination={{
                    page: pagination.page,
                    total: pagination.total,
                    pageSize: pagination.limit,
                }}
                onPageChange={handlePageChange}
                onDelete={deleteRide}
            />
        </div>
    );
}
