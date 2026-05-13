"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AlertCircle, CreditCard, DollarSign, RefreshCw, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
import { usePayments } from "../hooks/usePayments";
import { Payment, PaymentStatus } from "../types";

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
    PAID: { label: "Paid", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    FAILED: { label: "Failed", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    REFUNDED: { label: "Refunded", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
};

const methodConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    CASH: { label: "Cash", icon: <DollarSign className="h-3 w-3" /> },
    CARD: { label: "Card", icon: <CreditCard className="h-3 w-3" /> },
    WALLET: { label: "Wallet", icon: <Wallet className="h-3 w-3" /> },
};

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
    const config = statusConfig[status] ?? { label: status, className: "" };
    return (
        <Badge variant="outline" className={cn("font-medium text-xs", config.className)}>
            {config.label}
        </Badge>
    );
}

function PaymentRowSkeleton() {
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

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}

export function PaymentsView() {
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [search, setSearch] = useState("");

    const { payments, loading, error, pagination, updateParams, refetch } = usePayments({
        page: 1,
        limit: 20,
    });

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        updateParams({
            page: 1,
            status: value === "all" ? undefined : (value as PaymentStatus),
        });
    };

    const handlePageChange = (page: number) => {
        updateParams({ page });
    };

    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const paidCount = payments.filter((p) => p.status === "PAID").length;
    const pendingCount = payments.filter((p) => p.status === "PENDING").length;

    const filteredPayments = search
        ? payments.filter(
            (p) =>
                p.ride.client.name?.toLowerCase().includes(search.toLowerCase()) ||
                p.ride.client.email?.toLowerCase().includes(search.toLowerCase()) ||
                p.id.toString().includes(search)
        )
        : payments;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Payments"
                description="Monitor all platform transactions"
            />

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    title="Total Volume"
                    value={formatCurrency(totalAmount)}
                    icon={DollarSign}
                    variant="primary"
                    description="Current page total"
                />
                <StatCard
                    title="Paid"
                    value={paidCount}
                    icon={TrendingUp}
                    variant="success"
                    description="Successful payments"
                />
                <StatCard
                    title="Pending"
                    value={pendingCount}
                    icon={CreditCard}
                    variant="warning"
                    description="Awaiting confirmation"
                />
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Input
                            placeholder="Search by client name or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="sm:max-w-xs"
                        />
                        <Select value={statusFilter} onValueChange={handleStatusChange}>
                            <SelectTrigger className="sm:w-44">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="PAID">Paid</SelectItem>
                                <SelectItem value="FAILED">Failed</SelectItem>
                                <SelectItem value="REFUNDED">Refunded</SelectItem>
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
                                    <TableHead className="w-16">#ID</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Route</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <PaymentRowSkeleton key={i} />
                                    ))
                                ) : filteredPayments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                            No payments found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPayments.map((payment) => (
                                        <PaymentRow key={payment.id} payment={payment} />
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
        </div>
    );
}

function PaymentRow({ payment }: { payment: Payment }) {
    const method = methodConfig[payment.method] ?? { label: payment.method, icon: null };

    return (
        <TableRow className="hover:bg-muted/50">
            <TableCell className="font-mono text-xs text-muted-foreground">
                #{payment.id}
            </TableCell>
            <TableCell>
                <div>
                    <p className="font-medium text-sm">
                        {payment.ride.client.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {payment.ride.client.email ?? "-"}
                    </p>
                </div>
            </TableCell>
            <TableCell>
                <div className="max-w-[200px]">
                    <p className="text-xs truncate text-muted-foreground">
                        {payment.ride.pickupAddress ?? "-"}
                    </p>
                    <p className="text-xs truncate text-muted-foreground">
                        -&gt; {payment.ride.dropoffAddress ?? "-"}
                    </p>
                </div>
            </TableCell>
            <TableCell className="font-semibold">
                {formatCurrency(payment.amount)}
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {method.icon}
                    {method.label}
                </div>
            </TableCell>
            <TableCell>
                <PaymentStatusBadge status={payment.status} />
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
                {formatDate(payment.createdAt)}
            </TableCell>
        </TableRow>
    );
}
