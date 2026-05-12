"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { TopDriver } from "../types";

interface TopDriversListProps {
    drivers: TopDriver[];
}

export function TopDriversList({ drivers }: TopDriversListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Top Drivers
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {drivers.map((driver, index) => (
                        <div
                            key={driver.id}
                            className="flex items-center gap-4 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                                #{index + 1}
                            </div>
                            <Avatar>
                                <AvatarFallback>
                                    {driver?.user.name?.charAt(0) || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-semibold">
                                    {driver?.user.name || "Unknown Driver"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {driver?.totalRides} rides completed
                                </p>
                            </div>
                            <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 dark:bg-yellow-900">
                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                <span className="font-bold text-yellow-700 dark:text-yellow-300">
                                    {driver?.rating.toFixed(1)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
