"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RideType = "STANDARD" | "CARPOOLING";

interface TypeBadgeProps {
    type: RideType | string;
    className?: string;
}

const typeConfig: Record<RideType, { label: string; className: string }> = {
    STANDARD: {
        label: "Standard",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    },
    CARPOOLING: {
        label: "Carpooling",
        className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    },
};

export function TypeBadge({ type, className }: TypeBadgeProps) {
    const config = typeConfig[type as RideType] || {
        label: type,
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    };

    return (
        <Badge className={cn(config.className, "font-medium", className)}>
            {config.label}
        </Badge>
    );
}
