"use client";

import { useEffect, useState } from "react";
import { SupportService } from "../services/support.service";
import { SupportTicket, SupportTicketsListParams } from "../types";

export function useSupportTickets(initialParams: SupportTicketsListParams = {}) {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [params, setParams] = useState<SupportTicketsListParams>(initialParams);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
    });

    useEffect(() => {
        fetchTickets();
    }, [params]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await SupportService.getTickets(params);
            setTickets(data.tickets);
            setPagination(data.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch tickets");
        } finally {
            setLoading(false);
        }
    };

    const updateParams = (newParams: Partial<SupportTicketsListParams>) => {
        setParams((prev) => ({ ...prev, ...newParams }));
    };

    const resolveTicket = async (ticketId: number) => {
        try {
            await SupportService.resolveTicket(ticketId);
            await fetchTickets();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to resolve ticket");
        }
    };

    return {
        tickets,
        loading,
        error,
        pagination,
        params,
        updateParams,
        resolveTicket,
        refetch: fetchTickets,
    };
}
