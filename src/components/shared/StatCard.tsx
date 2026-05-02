"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        label: string;
    };
    href?: string;
    variant?: "default" | "primary" | "success" | "warning" | "danger";
}

const variantStyles = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-600",
    warning: "bg-yellow-500/10 text-yellow-600",
    danger: "bg-red-500/10 text-red-600",
};

export function StatCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    href,
    variant = "default",
}: StatCardProps) {
    const content = (
        <Card className="transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div
                    className={cn(
                        "rounded-full p-2",
                        variantStyles[variant]
                    )}
                >
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
                {trend && (
                    <p
                        className={cn(
                            "text-xs mt-2 flex items-center gap-1",
                            trend.value >= 0 ? "text-green-600" : "text-red-600"
                        )}
                    >
                        <span>{trend.value >= 0 ? "↗" : "↘"}</span>
                        <span className="font-medium">
                            {Math.abs(trend.value)}% {trend.label}
                        </span>
                    </p>
                )}
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
}
