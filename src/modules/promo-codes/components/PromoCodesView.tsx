"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Plus, RefreshCw, Tag, XCircle } from "lucide-react";
import { useState } from "react";
import { usePromoCodes } from "../hooks/usePromoCodes";
import { PromoCode } from "../types";
import { CreatePromoDialog } from "./CreatePromoDialog";

function formatDate(date: string | null) {
    if (!date) return "Never";
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(new Date(date));
}

function isExpired(expiresAt: string | null) {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
}

function PromoRowSkeleton() {
    return (
        <TableRow>
            {Array.from({ length: 7 }).map((_, i) => (
                <TableCell key={i}>
                    <Skeleton className="h-4 w-full" />
                </TableCell>
            ))}
        </TableRow>
    );
}

function PromoRow({ promo }: { promo: PromoCode }) {
    const expired = isExpired(promo.expiresAt);
    const usagePercent = promo.maxUses ? Math.round((promo.currentUses / promo.maxUses) * 100) : null;

    return (
        <TableRow className="hover:bg-muted/50">
            <TableCell>
                <span className="font-mono font-semibold text-sm tracking-wider">{promo.code}</span>
            </TableCell>
            <TableCell>
                <Badge
                    variant="outline"
                    className={cn(
                        "text-xs font-medium",
                        promo.discountType === "PERCENTAGE"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    )}
                >
                    {promo.discountType === "PERCENTAGE"
                        ? `${promo.discountValue}% OFF`
                        : `$${promo.discountValue} OFF`}
                </Badge>
            </TableCell>
            <TableCell>
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                            {promo.currentUses} / {promo.maxUses ?? "?"}
                        </span>
                        {usagePercent !== null && (
                            <span className="text-muted-foreground">{usagePercent}%</span>
                        )}
                    </div>
                    {usagePercent !== null && (
                        <Progress value={usagePercent} className="h-1.5" />
                    )}
                </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
                {formatDate(promo.expiresAt)}
            </TableCell>
            <TableCell>
                {expired ? (
                    <Badge variant="outline" className="bg-gray-100 text-gray-600 text-xs">
                        Expired
                    </Badge>
                ) : promo.isActive ? (
                    <div className="flex items-center gap-1.5 text-green-600 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Active
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <XCircle className="h-3.5 w-3.5" />
                        Inactive
                    </div>
                )}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
                {formatDate(promo.createdAt)}
            </TableCell>
        </TableRow>
    );
}

export function PromoCodesView() {
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [createOpen, setCreateOpen] = useState(false);

    const { promoCodes, loading, error, pagination, updateParams, createPromoCode, refetch } =
        usePromoCodes({ page: 1, limit: 20 });

    const handleActiveFilterChange = (value: string) => {
        setActiveFilter(value);
        updateParams({
            page: 1,
            isActive: value === "all" ? undefined : value === "true",
        });
    };

    const handlePageChange = (page: number) => {
        updateParams({ page });
    };

    const activeCount = promoCodes.filter((p) => p.isActive && !isExpired(p.expiresAt)).length;
    const expiredCount = promoCodes.filter((p) => isExpired(p.expiresAt)).length;
    const totalUses = promoCodes.reduce((sum, p) => sum + p.currentUses, 0);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Promo Codes"
                description="Manage discount codes and promotions"
                action={{
                    label: "Create Code",
                    onClick: () => setCreateOpen(true),
                    icon: Plus,
                }}
            />

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    title="Active Codes"
                    value={activeCount}
                    icon={Tag}
                    variant="success"
                    description="Currently active"
                />
                <StatCard
                    title="Total Uses"
                    value={totalUses}
                    icon={CheckCircle2}
                    variant="primary"
                    description="All time redemptions"
                />
                <StatCard
                    title="Expired"
                    value={expiredCount}
                    icon={XCircle}
                    variant="warning"
                    description="Expired codes"
                />
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <Select value={activeFilter} onValueChange={handleActiveFilterChange}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="All codes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Codes</SelectItem>
                                <SelectItem value="true">Active Only</SelectItem>
                                <SelectItem value="false">Inactive Only</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={refetch} className="ml-auto">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {error ? (
                        <div className="flex items-center gap-3 p-6 text-destructive">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Usage</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <PromoRowSkeleton key={i} />
                                    ))
                                ) : promoCodes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                            No promo codes found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    promoCodes.map((promo) => (
                                        <PromoRow key={promo.id} promo={promo} />
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Showing {((pagination.page - 1) * pagination.limit) + 1}-
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page <= 1}
                            onClick={() => handlePageChange(pagination.page - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => handlePageChange(pagination.page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            <CreatePromoDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSubmit={createPromoCode}
            />
        </div>
    );
}
