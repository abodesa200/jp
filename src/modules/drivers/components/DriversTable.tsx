"use client";

import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Eye, Pencil, Star, Trash2, X } from "lucide-react";
import Link from "next/link";
import { getServiceTypeLabel } from "../constants";
import { Driver } from "../types";

interface DriversTableProps {
    drivers: Driver[];
    loading: boolean;
    pagination: {
        page: number;
        total: number;
        pageSize: number;
    };
    onPageChange: (page: number) => void;
    onToggleApproval: (id: number, currentStatus: boolean) => void;
    onDelete: (id: number) => void;
    onEdit: (driver: Driver) => void;
}

export function DriversTable({
    drivers,
    loading,
    pagination,
    onPageChange,
    onToggleApproval,
    onDelete,
    onEdit,
}: DriversTableProps) {
    const columns = [
        {
            key: "driver",
            label: "Driver",
            render: (driver: Driver) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {driver.user.name?.charAt(0) || "?"}
                    </div>
                    <div>
                        <p className="font-medium">{driver.user.name || "Unknown"}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {driver.isOnline ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    <span className="mr-1">�</span> Online
                                </Badge>
                            ) : (
                                <Badge variant="outline">
                                    <span className="mr-1">?</span> Offline
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: "contact",
            label: "Contact",
            render: (driver: Driver) => (
                <div className="text-sm">
                    <p>{driver.user.phone}</p>
                    {driver.user.email && (
                        <p className="text-muted-foreground">{driver.user.email}</p>
                    )}
                </div>
            ),
        },
        {
            key: "vehicle",
            label: "Vehicle",
            render: (driver: Driver) => (
                <div className="text-sm">
                    <p className="font-medium">{driver.carModel}</p>
                    <p className="text-muted-foreground">{driver.carPlate}</p>
                    {driver.carColor && (
                        <p className="text-xs text-muted-foreground">{driver.carColor}</p>
                    )}
                </div>
            ),
        },
        {
            key: "category",
            label: "Category",
            render: (driver: Driver) => (
                <Badge variant="outline">{getServiceTypeLabel(driver.serviceType)}</Badge>
            ),
        },
        {
            key: "license",
            label: "License",
            render: (driver: Driver) => <span className="font-mono text-sm">{driver.licenseNumber}</span>,
        },
        {
            key: "rating",
            label: "Rating",
            render: (driver: Driver) => (
                <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-semibold">{driver.rating.toFixed(1)}</span>
                </div>
            ),
        },
        {
            key: "rides",
            label: "Rides",
            render: (driver: Driver) => <span className="font-semibold">{driver.totalRides}</span>,
        },
        {
            key: "status",
            label: "Status",
            render: (driver: Driver) => (
                <StatusBadge status={driver.isApproved ? "APPROVED" : "PENDING"} />
            ),
        },
        {
            key: "actions",
            label: "Actions",
            render: (driver: Driver) => (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/drivers/${driver.id}`}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(driver)}
                        title="Edit driver"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleApproval(driver.id, driver.isApproved)}
                    >
                        {driver.isApproved ? (
                            <X className="h-4 w-4 text-orange-600" />
                        ) : (
                            <Check className="h-4 w-4 text-green-600" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            if (confirm("Are you sure you want to delete this driver?")) {
                                onDelete(driver.id);
                            }
                        }}
                    >
                        <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <DataTable
            data={drivers}
            columns={columns}
            loading={loading}
            emptyMessage="No drivers found"
            pagination={{
                page: pagination.page,
                total: pagination.total,
                pageSize: pagination.pageSize,
                onPageChange,
            }}
        />
    );
}
