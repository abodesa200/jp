"use client";

import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TypeBadge } from "@/components/shared/TypeBadge";
import { Button } from "@/components/ui/button";
import { Eye, MapPin, Trash2 } from "lucide-react";
import Link from "next/link";
import { Ride } from "../types";

interface RidesTableProps {
    rides: Ride[];
    loading: boolean;
    pagination: {
        page: number;
        total: number;
        pageSize: number;
    };
    onPageChange: (page: number) => void;
    onDelete: (id: number) => void;
}

export function RidesTable({
    rides,
    loading,
    pagination,
    onPageChange,
    onDelete,
}: RidesTableProps) {
    const columns = [
        {
            key: "id",
            label: "ID",
            render: (ride: Ride) => <span className="font-mono text-xs">#{ride.id}</span>
        },
        {
            key: "client",
            label: "Client",
            render: (ride: Ride) => (
                <div>
                    <p className="font-medium">{ride.client.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{ride.client.phone}</p>
                </div>
            ),
        },
        {
            key: "driver",
            label: "Driver",
            render: (ride: Ride) =>
                ride.driver ? (
                    <div>
                        <p className="font-medium">{ride.driver.user.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">
                            {ride.driver.carModel} � {ride.driver.carPlate}
                        </p>
                    </div>
                ) : (
                    <span className="text-muted-foreground">No driver assigned</span>
                ),
        },
        {
            key: "type",
            label: "Type",
            render: (ride: Ride) => <TypeBadge type={ride.type} />
        },
        {
            key: "distance",
            label: "Distance",
            render: (ride: Ride) => (
                <span className="text-sm">{ride.distance ? `${ride.distance.toFixed(1)} km` : "-"}</span>
            ),
        },
        {
            key: "fare",
            label: "Fare",
            render: (ride: Ride) => (
                <span className="font-semibold">{ride.fare ? `$${ride.fare.toFixed(2)}` : "-"}</span>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (ride: Ride) => <StatusBadge status={ride.status} />
        },
        {
            key: "date",
            label: "Date",
            render: (ride: Ride) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(ride.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}
                </span>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            render: (ride: Ride) => (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/rides/${ride.id}/track`}>
                            <MapPin className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/rides/${ride.id}`}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            if (confirm("Are you sure you want to delete this ride?")) {
                                onDelete(ride.id);
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
            data={rides}
            columns={columns}
            loading={loading}
            emptyMessage="No rides found"
            pagination={{
                page: pagination.page,
                total: pagination.total,
                pageSize: pagination.pageSize,
                onPageChange,
            }}
        />
    );
}
