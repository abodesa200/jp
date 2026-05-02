"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status =
    | "REQUESTED"
    | "ACCEPTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "PENDING"
    | "APPROVED"
    | "REJECTED";

interface StatusBadgeProps {
    status: Status | string;
    className?: string;
}

const statusConfig: Record<
    Status,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
    REQUESTED: { label: "Requested", variant: "default" },
    ACCEPTED: { label: "Accepted", variant: "secondary" },
    IN_PROGRESS: { label: "In Progress", variant: "default" },
    COMPLETED: { label: "Completed", variant: "secondary" },
    CANCELLED: { label: "Cancelled", variant: "destructive" },
    PENDING: { label: "Pending", variant: "outline" },
    APPROVED: { label: "Approved", variant: "secondary" },
    REJECTED: { label: "Rejected", variant: "destructive" },
};

const statusColors: Record<Status, string> = {
    REQUESTED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    ACCEPTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    IN_PROGRESS: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status as Status] || {
        label: status,
        variant: "default" as const,
    };
    const colorClass = statusColors[status as Status] || statusColors.PENDING;

    return (
        <Badge
            variant={config.variant}
            className={cn(colorClass, "font-medium", className)}
        >
            {config.label}
        </Badge>
    );
}
