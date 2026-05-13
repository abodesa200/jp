import { CreatePromoCodeData, PromoCode, PromoCodesListParams, PromoCodesListResponse } from "../types";

export class PromoCodesService {
    private static getAuthHeaders() {
        const token = localStorage.getItem("token");
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    }

    static async getPromoCodes(params: PromoCodesListParams): Promise<PromoCodesListResponse> {
        const isActive =
            params.isActive === undefined
                ? undefined
                : params.isActive
                    ? "active"
                    : "inactive";

        const searchParams = new URLSearchParams({
            page: (params.page || 1).toString(),
            limit: (params.limit || 20).toString(),
            ...(isActive && { isActive }),
        });

        const response = await fetch(`/api/admin/promo-codes?${searchParams}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch promo codes");
        }

        return response.json();
    }

    static async createPromoCode(data: CreatePromoCodeData): Promise<PromoCode> {
        const response = await fetch("/api/admin/promo-codes", {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const json = await response.json();
            throw new Error(json.error || "Failed to create promo code");
        }

        const json = await response.json();
        return json.promoCode;
    }
}
