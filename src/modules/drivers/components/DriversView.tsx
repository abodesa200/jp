"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useDrivers } from "../hooks/useDrivers";
import type { Driver } from "../types";
import { CreateDriverDialog } from "./CreateDriverDialog";
import { EditDriverDialog } from "./EditDriverDialog";
import { DriversFilters } from "./DriversFilters";
import { DriversTable } from "./DriversTable";

export function DriversView() {
    const [approvedFilter, setApprovedFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

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
            isApproved: value === "all" ? undefined : value === "true",
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

    const handleEditDriver = (driver: Driver) => {
        setSelectedDriver(driver);
        setEditDialogOpen(true);
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

            <EditDriverDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                driver={selectedDriver}
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
                onEdit={handleEditDriver}
            />
        </div>
    );
}
