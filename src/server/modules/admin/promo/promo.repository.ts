import { prisma } from "@/lib/prisma";
import {
    CreatePromoCodeDTO,
    GetPromoCodesQueryDTO,
    UpdatePromoCodeDTO,
} from "./promo.schema";

// ─────────────────────────────────────────────
// Get Promo Codes
// ─────────────────────────────────────────────

export async function getPromoCodes(query: GetPromoCodesQueryDTO) {
    const skip = (query.page - 1) * query.limit;

    const where: any = {};

    // Filter by active status
    if (query.isActive !== "all") {
        where.isActive = query.isActive === "active";
    }

    // Search by code
    if (query.search) {
        where.code = {
            contains: query.search,
            mode: "insensitive",
        };
    }

    const [promoCodes, total] = await Promise.all([
        prisma.promoCode.findMany({
            where,
            skip,
            take: query.limit,
            orderBy: { createdAt: "desc" },
            include: {
                usages: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        usages: true,
                    },
                },
            },
        }),
        prisma.promoCode.count({ where }),
    ]);

    return { promoCodes, total };
}

// ─────────────────────────────────────────────
// Get Promo Code by ID
// ─────────────────────────────────────────────

export async function getPromoCodeById(promoId: number) {
    return prisma.promoCode.findUnique({
        where: { id: promoId },
        include: {
            usages: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    usages: true,
                },
            },
        },
    });
}

// ─────────────────────────────────────────────
// Find by Code
// ─────────────────────────────────────────────

export async function findByCode(code: string) {
    return prisma.promoCode.findUnique({
        where: { code },
    });
}

// ─────────────────────────────────────────────
// Create Promo Code
// ─────────────────────────────────────────────

export async function createPromoCode(data: CreatePromoCodeDTO) {
    return prisma.promoCode.create({
        data: {
            code: data.code.toUpperCase(),
            discountType: data.discountType,
            discountValue: data.discountValue,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            maxUses: data.maxUses,
            isActive: data.isActive ?? true,
        },
    });
}

// ─────────────────────────────────────────────
// Update Promo Code
// ─────────────────────────────────────────────

export async function updatePromoCode(
    promoId: number,
    data: UpdatePromoCodeDTO
) {
    const updateData: any = {};

    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.discountType !== undefined)
        updateData.discountType = data.discountType;
    if (data.discountValue !== undefined)
        updateData.discountValue = data.discountValue;
    if (data.expiresAt !== undefined)
        updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.promoCode.update({
        where: { id: promoId },
        data: updateData,
    });
}

// ─────────────────────────────────────────────
// Delete Promo Code
// ─────────────────────────────────────────────

export async function deletePromoCode(promoId: number) {
    return prisma.promoCode.delete({
        where: { id: promoId },
    });
}

// ─────────────────────────────────────────────
// Get Promo Stats
// ─────────────────────────────────────────────

export async function getPromoStats() {
    const [total, active, expired, totalUsages] = await Promise.all([
        prisma.promoCode.count(),
        prisma.promoCode.count({ where: { isActive: true } }),
        prisma.promoCode.count({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        }),
        prisma.promoCodeUsage.count(),
    ]);

    return {
        total,
        active,
        expired,
        totalUsages,
    };
}

export const promoRepository = {
    getPromoCodes,
    getPromoCodeById,
    findByCode,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    getPromoStats,
};
