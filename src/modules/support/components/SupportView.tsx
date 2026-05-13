"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle2, Clock, MessageSquare, RefreshCw, User } from "lucide-react";
import { useState } from "react";
import { useSupportTickets } from "../hooks/useSupportTickets";
import { SupportTicket } from "../types";

function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(date));
}

function TicketRowSkeleton() {
    return (
        <TableRow>
            {Array.from({ length: 6 }).map((_, i) => (
                <TableCell key={i}>
                    <Skeleton className="h-4 w-full" />
                </TableCell>
            ))}
        </TableRow>
    );
}

function TicketDetailDialog({
    ticket,
    open,
    onOpenChange,
    onResolve,
    resolving,
}: {
    ticket: SupportTicket | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onResolve: (id: number) => void;
    resolving: boolean;
}) {
    if (!ticket) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Ticket #{ticket.id}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">{ticket.user.name ?? "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                                {ticket.user.email ?? ticket.user.phone ?? "-"} • {ticket.user.role}
                            </p>
                        </div>
                        <Badge
                            variant="outline"
                            className={
                                ticket.isResolved
                                    ? "ml-auto bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "ml-auto bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }
                        >
                            {ticket.isResolved ? "Resolved" : "Open"}
                        </Badge>
                    </div>

                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</p>
                        <p className="text-sm font-semibold">{ticket.subject}</p>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Message</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Submitted {formatDate(ticket.createdAt)}
                    </p>

                    {!ticket.isResolved && (
                        <Button
                            className="w-full"
                            onClick={() => onResolve(ticket.id)}
                            disabled={resolving}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            {resolving ? "Resolving..." : "Mark as Resolved"}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function SupportView() {
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [resolving, setResolving] = useState(false);

    const { tickets, loading, error, pagination, updateParams, resolveTicket, refetch } =
        useSupportTickets({ page: 1, limit: 20 });

    const handleStatusFilterChange = (value: string) => {
        setStatusFilter(value);
        updateParams({
            page: 1,
            status: value === "all" ? undefined : (value as "open" | "resolved"),
        });
    };

    const handlePageChange = (page: number) => {
        updateParams({ page });
    };

    const handleViewTicket = (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        setDetailOpen(true);
    };

    const handleResolve = async (id: number) => {
        setResolving(true);
        await resolveTicket(id);
        setResolving(false);
        setDetailOpen(false);
    };

    const openCount = tickets.filter((t) => !t.isResolved).length;
    const resolvedCount = tickets.filter((t) => t.isResolved).length;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Support Tickets"
                description="Manage user support requests"
            />

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                    title="Total Tickets"
                    value={pagination.total}
                    icon={MessageSquare}
                    variant="primary"
                    description="All time"
                />
                <StatCard
                    title="Open"
                    value={openCount}
                    icon={Clock}
                    variant="warning"
                    description="Awaiting resolution"
                />
                <StatCard
                    title="Resolved"
                    value={resolvedCount}
                    icon={CheckCircle2}
                    variant="success"
                    description="Current page"
                />
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="All tickets" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tickets</SelectItem>
                                <SelectItem value="open">Open Only</SelectItem>
                                <SelectItem value="resolved">Resolved Only</SelectItem>
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
                                    <TableHead>User</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <TicketRowSkeleton key={i} />
                                    ))
                                ) : tickets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                            No support tickets found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    tickets.map((ticket) => (
                                        <TableRow
                                            key={ticket.id}
                                            className="hover:bg-muted/50 cursor-pointer"
                                            onClick={() => handleViewTicket(ticket)}
                                        >
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                #{ticket.id}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {ticket.user.name ?? "Unknown"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {ticket.user.email ?? ticket.user.phone ?? "-"}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm max-w-[240px] truncate">
                                                    {ticket.subject}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                {ticket.isResolved ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs"
                                                    >
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Resolved
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs"
                                                    >
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        Open
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {formatDate(ticket.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewTicket(ticket);
                                                    }}
                                                >
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
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

            <TicketDetailDialog
                ticket={selectedTicket}
                open={detailOpen}
                onOpenChange={setDetailOpen}
                onResolve={handleResolve}
                resolving={resolving}
            />
        </div>
    );
}
