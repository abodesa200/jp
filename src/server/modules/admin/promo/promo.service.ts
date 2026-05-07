import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { promoRepository } from "./promo.repository";
import {
    CreatePromoCodeDTO,
    GetPromoCodesQueryDTO,
    UpdatePromoCodeDTO,
} from "./promo.schema";

type JWTPayload = {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
};

// ─────────────────────────────────────────────
// Get Promo Codes
// ─────────────────────────────────────────────

export async function getPromoCodesService(
    payload: JWTPayload,
    query: GetPromoCodesQueryDTO
) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const { promoCodes, total } = await promoRepository.getPromoCodes(query);

    return {
        promoCodes,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

// ─────────────────────────────────────────────
// Get Promo Code by ID
// ─────────────────────────────────────────────

export async function getPromoCodeByIdService(
    payload: JWTPayload,
    promoId: number
) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const promoCode = await promoRepository.getPromoCodeById(promoId);

    if (!promoCode) {
        throw new NotFoundError("Promo code not found");
    }

    return { promoCode };
}

// ─────────────────────────────────────────────
// Create Promo Code
// ─────────────────────────────────────────────

export async function createPromoCodeService(
    payload: JWTPayload,
    data: CreatePromoCodeDTO
) {
    if (payload.role !== "ADMIN") {
        throw new ForbiddenError("Admin access required");
    }

    // Check if code already exists
    const existing = await promoRepository.findByCode(data.code);
    if (existing) {
        throw new ConflictError("Promo code already exists");
    }

    const promoCode = await promoRepository.createPromoCode(data);

    return {
        promoCode,
        message: "Promo code created successfully",
    };
}

// ─────────────────────────────────────────────
// Update Promo Code
// ─────────────────────────────────────────────

export async function updatePromoCodeService(
    payload: JWTPayload,
    promoId: number,
    data: UpdatePromoCodeDTO
) {
    if (payload.role !== "ADMIN") {
        throw new ForbiddenError("Admin access required");
    }

    const promoCode = await promoRepository.getPromoCodeById(promoId);

    if (!promoCode) {
        throw new NotFoundError("Promo code not found");
    }

    // If updating code, check if new code already exists
    if (data.code && data.code !== promoCode.code) {
        const existing = await promoRepository.findByCode(data.code);
        if (existing) {
            throw new ConflictError("Promo code already exists");
        }
    }

    const updatedPromoCode = await promoRepository.updatePromoCode(
        promoId,
        data
    );

    return {
        promoCode: updatedPromoCode,
        message: "Promo code updated successfully",
    };
}

// ─────────────────────────────────────────────
// Delete Promo Code
// ─────────────────────────────────────────────

export async function deletePromoCodeService(
    payload: JWTPayload,
    promoId: number
) {
    if (payload.role !== "ADMIN") {
        throw new ForbiddenError("Admin access required");
    }

    const promoCode = await promoRepository.getPromoCodeById(promoId);

    if (!promoCode) {
        throw new NotFoundError("Promo code not found");
    }

    await promoRepository.deletePromoCode(promoId);

    return {
        message: "Promo code deleted successfully",
    };
}

// ─────────────────────────────────────────────
// Get Promo Code Stats
// ─────────────────────────────────────────────

export async function getPromoStatsService(payload: JWTPayload) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const stats = await promoRepository.getPromoStats();

    return { stats };
}
