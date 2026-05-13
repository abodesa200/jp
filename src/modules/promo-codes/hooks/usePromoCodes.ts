"use client";

import { useEffect, useState } from "react";
import { PromoCodesService } from "../services/promo-codes.service";
import { CreatePromoCodeData, PromoCode, PromoCodesListParams } from "../types";

export function usePromoCodes(initialParams: PromoCodesListParams = {}) {
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [params, setParams] = useState<PromoCodesListParams>(initialParams);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    useEffect(() => {
        fetchPromoCodes();
    }, [params]);

    const fetchPromoCodes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await PromoCodesService.getPromoCodes(params);
            setPromoCodes(data.promoCodes);
            setPagination(data.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch promo codes");
        } finally {
            setLoading(false);
        }
    };

    const updateParams = (newParams: Partial<PromoCodesListParams>) => {
        setParams((prev) => ({ ...prev, ...newParams }));
    };

    const createPromoCode = async (data: CreatePromoCodeData) => {
        await PromoCodesService.createPromoCode(data);
        await fetchPromoCodes();
    };

    return {
        promoCodes,
        loading,
        error,
        pagination,
        params,
        updateParams,
        createPromoCode,
        refetch: fetchPromoCodes,
    };
}
