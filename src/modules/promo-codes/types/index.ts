export type DiscountType = "PERCENTAGE" | "FIXED";

export interface PromoCode {
    id: number;
    code: string;
    discountType: DiscountType;
    discountValue: number;
    isActive: boolean;
    expiresAt: string | null;
    maxUses: number | null;
    currentUses: number;
    createdAt: string;
    updatedAt: string;
    _count?: {
        usages: number;
    };
}

export interface CreatePromoCodeData {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    expiresAt?: string;
    maxUses?: number;
    isActive: boolean;
}

export interface PromoCodesListParams {
    page?: number;
    limit?: number;
    isActive?: boolean;
}

export interface PromoCodesListResponse {
    promoCodes: PromoCode[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
