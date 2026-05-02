"use client";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, List } from "lucide-react";
import Link from "next/link";
import { RecentRide } from "../types";

interface RecentRidesListProps {
    rides: RecentRide[];
}

export function RecentRidesList({ rides }: RecentRidesListProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5" />
                    Recent Rides
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/rides">
                        View All
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {rides.slice(0, 5).map((ride) => (
                        <div
                            key={ride.id}
                            className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                        >
                            <div className="flex-1">
                                <p className="font-semibold">
                                    {ride.client.name || "Unknown Client"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(ride.createdAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusBadge status={ride.status} />
                                <p className="min-w-[60px] text-right font-bold">
                                    ${ride.fare?.toFixed(2) || "—"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
