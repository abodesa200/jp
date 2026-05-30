import { prisma } from "@/lib/prisma";
import {
    CreatePromoCodeDTO,
    GetPromoCodesQueryDTO,
    UpdatePromoCodeDTO,
} from "./promo.schema";

// ─────────────────────────────────────────────
// Get Coupons
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
        prisma.coupon.findMany({
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
        prisma.coupon.count({ where }),
    ]);

    return { promoCodes, total };
}

// ─────────────────────────────────────────────
// Get Coupon by ID
// ─────────────────────────────────────────────

export async function getPromoCodeById(promoId: number) {
    return prisma.coupon.findUnique({
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
    return prisma.coupon.findUnique({
        where: { code },
    });
}

// ─────────────────────────────────────────────
// Create Coupon
// ─────────────────────────────────────────────

export async function createPromoCode(data: CreatePromoCodeDTO) {
    return prisma.coupon.create({
        data: {
            code: data.code.toUpperCase(),
            discountType: data.discountType,
            discountValue: data.discountValue,
            maxDiscount: data.maxDiscount ?? null,
            minFare: data.minFare ?? null,
            usageLimit: data.usageLimit ?? null,
            perUserLimit: data.perUserLimit ?? 1,
            startsAt: data.startsAt ? new Date(data.startsAt) : null,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            isActive: data.isActive ?? true,
            newUsersOnly: data.newUsersOnly ?? false,
        },
    });
}

// ─────────────────────────────────────────────
// Update Coupon
// ─────────────────────────────────────────────

export async function updatePromoCode(
    promoId: number,
    data: UpdatePromoCodeDTO
) {
    const updateData: any = {};

    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.discountType !== undefined) updateData.discountType = data.discountType;
    if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
    if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount;
    if (data.minFare !== undefined) updateData.minFare = data.minFare;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
    if (data.perUserLimit !== undefined) updateData.perUserLimit = data.perUserLimit;
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.newUsersOnly !== undefined) updateData.newUsersOnly = data.newUsersOnly;

    return prisma.coupon.update({
        where: { id: promoId },
        data: updateData,
    });
}

// ─────────────────────────────────────────────
// Delete Coupon
// ─────────────────────────────────────────────

export async function deletePromoCode(promoId: number) {
    return prisma.coupon.delete({
        where: { id: promoId },
    });
}

// ─────────────────────────────────────────────
// Get Coupon Stats
// ─────────────────────────────────────────────

export async function getPromoStats() {
    const now = new Date();

    const [total, active, expired, totalUsages] = await Promise.all([
        prisma.coupon.count(),
        prisma.coupon.count({ where: { isActive: true } }),
        prisma.coupon.count({
            where: {
                expiresAt: {
                    lt: now,
                },
            },
        }),
        prisma.couponUsage.count(),
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
