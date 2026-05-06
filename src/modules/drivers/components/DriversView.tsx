"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useDrivers } from "../hooks/useDrivers";
import { CreateDriverDialog } from "./CreateDriverDialog";
import { DriversFilters } from "./DriversFilters";
import { DriversTable } from "./DriversTable";

export function DriversView() {
    const [approvedFilter, setApprovedFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const {
        drivers,
        loading,
        pagination,
        updateParams,
        toggleApproval,
        deleteDriver,
        refetch,
    } = useDrivers({
        page: 1,
        limit: 20,
    });

    const handleApprovedFilterChange = (value: string) => {
        setApprovedFilter(value);
        updateParams({
            page: 1,
            approved: value === "all" ? undefined : value === "true",
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
                title="Drivers"
                description="Manage all platform drivers"
                action={{
                    label: "Add Driver",
                    onClick: () => setCreateDialogOpen(true),
                    icon: Plus,
                }}
            />

            <CreateDriverDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={() => refetch()}
            />

            <DriversFilters
                approvedFilter={approvedFilter}
                searchQuery={searchQuery}
                totalCount={pagination.total}
                onApprovedFilterChange={handleApprovedFilterChange}
                onSearchChange={handleSearchChange}
            />

            <DriversTable
                drivers={drivers}
                loading={loading}
                pagination={{
                    page: pagination.page,
                    total: pagination.total,
                    pageSize: pagination.limit,
                }}
                onPageChange={handlePageChange}
                onToggleApproval={toggleApproval}
                onDelete={deleteDriver}
            />
        </div>
    );
}
