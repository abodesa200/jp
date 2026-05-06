"use client";

import { useEffect, useState } from "react";
import { PaymentsService } from "../services/payments.service";
import { Payment, PaymentsListParams } from "../types";

export function usePayments(initialParams: PaymentsListParams = {}) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [params, setParams] = useState<PaymentsListParams>(initialParams);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
    });

    useEffect(() => {
        fetchPayments();
    }, [params]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await PaymentsService.getPayments(params);
            setPayments(data.payments);
            setPagination(data.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch payments");
        } finally {
            setLoading(false);
        }
    };

    const updateParams = (newParams: Partial<PaymentsListParams>) => {
        setParams((prev) => ({ ...prev, ...newParams }));
    };

    return {
        payments,
        loading,
        error,
        pagination,
        params,
        updateParams,
        refetch: fetchPayments,
    };
}
