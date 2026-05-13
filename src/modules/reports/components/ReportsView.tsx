"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    TrendingUp,
    Users,
} from "lucide-react";
import { useReports } from "../hooks/useReports";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatNumber(n: number) {
    return new Intl.NumberFormat("en-US").format(n);
}

function StatSkeleton() {
    return <Skeleton className="h-28 w-full rounded-xl" />;
}

export function ReportsView() {
    const { rideStats, revenueStats, driverStats, userStats, loading, error, refetch } = useReports();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Reports & Analytics"
                description="Platform performance insights and statistics"
            />

            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={refetch}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

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

                <TabsContent value="rides" className="space-y-6 mt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)
                        ) : rideStats ? (
                            <>
                                <StatCard title="Total Rides" value={formatNumber(rideStats.total)} icon={MapPin} variant="primary" />
                                <StatCard title="Requested" value={formatNumber(rideStats.requested)} icon={TrendingUp} variant="warning" />
                                <StatCard title="Accepted" value={formatNumber(rideStats.accepted)} icon={CheckCircle2} variant="success" />
                                <StatCard title="In Progress" value={formatNumber(rideStats.inProgress)} icon={BarChart3} variant="default" />
                                <StatCard title="Completed" value={formatNumber(rideStats.completed)} icon={CheckCircle2} variant="success" />
                                <StatCard title="Cancelled" value={formatNumber(rideStats.cancelled)} icon={AlertCircle} variant="danger" />
                            </>
                        ) : null}
                    </div>
                </TabsContent>

                <TabsContent value="revenue" className="space-y-6 mt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
                        ) : revenueStats ? (
                            <>
                                <StatCard title="Total Revenue" value={formatCurrency(revenueStats.total)} icon={DollarSign} variant="success" />
                                <StatCard title="Today" value={formatCurrency(revenueStats.daily)} icon={TrendingUp} variant="primary" />
                                <StatCard title="Last 7 Days" value={formatCurrency(revenueStats.weekly)} icon={BarChart3} variant="default" />
                                <StatCard title="This Month" value={formatCurrency(revenueStats.monthly)} icon={CheckCircle2} variant="warning" />
                            </>
                        ) : null}
                    </div>
                </TabsContent>

                <TabsContent value="drivers" className="space-y-6 mt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)
                        ) : driverStats ? (
                            <>
                                <StatCard title="Total Drivers" value={formatNumber(driverStats.total)} icon={Car} variant="primary" />
                                <StatCard title="Approved" value={formatNumber(driverStats.approved)} icon={CheckCircle2} variant="success" />
                                <StatCard title="Pending" value={formatNumber(driverStats.pending)} icon={AlertCircle} variant="warning" />
                                <StatCard title="Online" value={formatNumber(driverStats.online)} icon={TrendingUp} variant="success" />
                                <StatCard title="Offline" value={formatNumber(driverStats.offline)} icon={BarChart3} variant="default" />
                            </>
                        ) : null}
                    </div>
                </TabsContent>

                <TabsContent value="users" className="space-y-6 mt-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
                        ) : userStats ? (
                            <>
                                <StatCard title="Total Users" value={formatNumber(userStats.total)} icon={Users} variant="primary" />
                                <StatCard title="Verified" value={formatNumber(userStats.verified)} icon={CheckCircle2} variant="success" />
                                <StatCard title="Unverified" value={formatNumber(userStats.unverified)} icon={AlertCircle} variant="warning" />
                                <StatCard title="New (30 Days)" value={formatNumber(userStats.recentGrowth)} icon={TrendingUp} variant="default" />
                            </>
                        ) : null}
                    </div>

                    {!loading && userStats && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Verification Ratio</CardTitle>
                            </CardHeader>
                            <CardContent className="flex gap-2">
                                <Badge variant="secondary">Verified: {userStats.total ? Math.round((userStats.verified / userStats.total) * 100) : 0}%</Badge>
                                <Badge variant="outline">Unverified: {userStats.total ? Math.round((userStats.unverified / userStats.total) * 100) : 0}%</Badge>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
