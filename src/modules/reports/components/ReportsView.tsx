"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertCircle,
    BarChart3,
    Car,
    CheckCircle2,
    DollarSign,
    MapPin,
    RefreshCw,
    Star,
    TrendingUp,
    Users,
} from "lucide-react";
import { useState } from "react";
import { useReports } from "../hooks/useReports";
import { ReportFilters } from "../types";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatNumber(n: number) {
    return new Intl.NumberFormat("en-US").format(n);
}

function StatSkeleton() {
    return <Skeleton className="h-28 w-full rounded-xl" />;
}

function BarItem({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{formatNumber(value)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

export function ReportsView() {
    const [filters, setFilters] = useState<ReportFilters>({});
    const [pendingFilters, setPendingFilters] = useState<ReportFilters>({});

    const { rideStats, revenueStats, driverStats, userStats, loading, error, refetch } =
        useReports(filters);

    const applyFilters = () => {
        setFilters(pendingFilters);
    };

    const clearFilters = () => {
        setPendingFilters({});
        setFilters({});
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Reports & Analytics"
                description="Platform performance insights and statistics"
            />

            {/* Date Range Filter */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Date Range
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="startDate">From</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={pendingFilters.startDate ?? ""}
                                onChange={(e) =>
                                    setPendingFilters((f) => ({ ...f, startDate: e.target.value || undefined }))
                                }
                                className="w-44"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="endDate">To</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={pendingFilters.endDate ?? ""}
                                onChange={(e) =>
                                    setPendingFilters((f) => ({ ...f, endDate: e.target.value || undefined }))
                                }
                                className="w-44"
                            />
                        </div>
                        <Button onClick={applyFilters} size="sm">
                            Apply
                        </Button>
                        {(filters.startDate || filters.endDate) && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                Clear
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={refetch} className="ml-auto">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Failed to load reports</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="rides">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="rides">
                        <MapPin className="h-4 w-4 mr-2" />
                        Rides
                    </TabsTrigger>
                    <TabsTrigger value="revenue">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Revenue
                    </TabsTrigger>
                    <TabsTrigger value="drivers">
                        <Car className="h-4 w-4 mr-2" />
                        Drivers
                    </TabsTrigger>
                    <TabsTrigger value="users">
                        <Users className="h-4 w-4 mr-2" />
                        Users
                    </TabsTrigger>
                </TabsList>

                {/* ── RIDES TAB ── */}
                <TabsContent value="rides" className="space-y-6 mt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
                        ) : rideStats ? (
                            <>
                                <StatCard
                                    title="Total Rides"
                                    value={formatNumber(rideStats.summary.totalRides)}
                                    icon={MapPin}
                                    variant="primary"
                                />
                                <StatCard
                                    title="Completed"
                                    value={formatNumber(rideStats.summary.completedRides)}
                                    icon={CheckCircle2}
                                    variant="success"
                                />
                                <StatCard
                                    title="Cancelled"
                                    value={formatNumber(rideStats.summary.cancelledRides)}
                                    icon={AlertCircle}
                                    variant="danger"
                                />
                                <StatCard
                                    title="Active Now"
                                    value={formatNumber(rideStats.summary.activeRides)}
                                    icon={TrendingUp}
                                    variant="warning"
                                />
                            </>
                        ) : null}
                    </div>

                    {rideStats && (
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">By Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {rideStats.byStatus.map((item) => (
                                        <BarItem
                                            key={item.status}
                                            label={item.status}
                                            value={item.count}
                                            max={rideStats.summary.totalRides}
                                            color="bg-primary"
                                        />
                                    ))}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Metrics (Completed Rides)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                                            <p className="text-xs text-muted-foreground">Avg Fare</p>
                                            <p className="text-lg font-bold">
                                                {formatCurrency(rideStats.metrics.averageFare)}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                                            <p className="text-xs text-muted-foreground">Total Revenue</p>
                                            <p className="text-lg font-bold">
                                                {formatCurrency(rideStats.metrics.totalRevenue)}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                                            <p className="text-xs text-muted-foreground">Avg Distance</p>
                                            <p className="text-lg font-bold">
                                                {rideStats.metrics.averageDistance.toFixed(1)} km
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                                            <p className="text-xs text-muted-foreground">Avg Duration</p>
                                            <p className="text-lg font-bold">
                                                {Math.round(rideStats.metrics.averageDuration / 60)} min
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                {/* ── REVENUE TAB ── */}
                <TabsContent value="revenue" className="space-y-6 mt-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => <StatSkeleton key={i} />)
                        ) : revenueStats ? (
                            <>
                                <StatCard
                                    title="Total Revenue"
                                    value={formatCurrency(revenueStats.summary.totalRevenue)}
                                    icon={DollarSign}
                                    variant="success"
                                />
                                <StatCard
                                    title="Avg Transaction"
                                    value={formatCurrency(revenueStats.summary.averageTransaction)}
                                    icon={TrendingUp}
                                    variant="primary"
                                />
                                <StatCard
                                    title="Total Transactions"
                                    value={formatNumber(revenueStats.summary.totalTransactions)}
                                    icon={BarChart3}
                                    variant="default"
                                />
                            </>
                        ) : null}
                    </div>

                    {revenueStats && (
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Revenue by Payment Method</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {revenueStats.byMethod.map((item) => (
                                        <div key={item.method} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {item.method}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {item.count} transactions
                                                </span>
                                            </div>
                                            <span className="font-semibold text-sm">
                                                {formatCurrency(item.revenue)}
                                            </span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Revenue by Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {revenueStats.byStatus.map((item) => (
                                        <BarItem
                                            key={item.status}
                                            label={item.status}
                                            value={item.revenue}
                                            max={revenueStats.summary.totalRevenue}
                                            color={
                                                item.status === "PAID"
                                                    ? "bg-green-500"
                                                    : item.status === "REFUNDED"
                                                        ? "bg-blue-500"
                                                        : item.status === "FAILED"
                                                            ? "bg-red-500"
                                                            : "bg-yellow-500"
                                            }
                                        />
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                {/* ── DRIVERS TAB ── */}
                <TabsContent value="drivers" className="space-y-6 mt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)
                        ) : driverStats ? (
                            <>
                                <StatCard
                                    title="Total Drivers"
                                    value={formatNumber(driverStats.summary.totalDrivers)}
                                    icon={Car}
                                    variant="primary"
                                />
                                <StatCard
                                    title="Approved"
                                    value={formatNumber(driverStats.summary.approvedDrivers)}
                                    icon={CheckCircle2}
                                    variant="success"
                                />
                                <StatCard
                                    title="Pending Approval"
                                    value={formatNumber(driverStats.summary.pendingDrivers)}
                                    icon={AlertCircle}
                                    variant="warning"
                                />
                                <StatCard
                                    title="Online Now"
                                    value={formatNumber(driverStats.summary.onlineDrivers)}
                                    icon={TrendingUp}
                                    variant="success"
                                />
                                <StatCard
                                    title="Avg Rating"
                                    value={driverStats.summary.averageRating.toFixed(2)}
                                    icon={Star}
                                    variant="primary"
                                />
                                <StatCard
                                    title="Avg Rides/Driver"
                                    value={driverStats.summary.averageRidesPerDriver.toFixed(1)}
                                    icon={MapPin}
                                    variant="default"
                                />
                            </>
                        ) : null}
                    </div>

                    {driverStats && driverStats.topDrivers.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Top Rated Drivers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {driverStats.topDrivers.map((driver, idx) => (
                                        <div key={driver.id} className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-muted-foreground w-5">
                                                {idx + 1}
                                            </span>
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <Car className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {driver.name ?? "Unknown"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {driver.carModel}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="flex items-center gap-1 text-sm font-semibold">
                                                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                                    {driver.rating.toFixed(1)}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {driver.totalRides} rides
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* ── USERS TAB ── */}
                <TabsContent value="users" className="space-y-6 mt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)
                        ) : userStats ? (
                            <>
                                <StatCard
                                    title="Total Users"
                                    value={formatNumber(userStats.summary.totalUsers)}
                                    icon={Users}
                                    variant="primary"
                                />
                                <StatCard
                                    title="New Users"
                                    value={formatNumber(userStats.summary.newUsers)}
                                    icon={TrendingUp}
                                    variant="success"
                                    description="In selected period"
                                />
                                <StatCard
                                    title="Verified"
                                    value={formatNumber(userStats.summary.verifiedUsers)}
                                    icon={CheckCircle2}
                                    variant="success"
                                />
                                <StatCard
                                    title="Active Clients"
                                    value={formatNumber(userStats.summary.activeClients)}
                                    icon={Users}
                                    variant="default"
                                    description="With at least 1 ride"
                                />
                                <StatCard
                                    title="Active Drivers"
                                    value={formatNumber(userStats.summary.activeDrivers)}
                                    icon={Car}
                                    variant="default"
                                    description="With at least 1 ride"
                                />
                            </>
                        ) : null}
                    </div>

                    {userStats && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Users by Role</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {userStats.byRole.map((item) => (
                                    <BarItem
                                        key={item.role}
                                        label={item.role}
                                        value={item.count}
                                        max={userStats.summary.totalUsers}
                                        color="bg-primary"
                                    />
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
