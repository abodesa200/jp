import { ConflictError, ForbiddenError, NotFoundError } from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import { ApplyPromoDTO, CreatePromoDTO, GetPromoCodesQueryDTO } from "./promo.schema";

type Payload = {
    userId: number;
    role: string;
};

// ─────────────────────────────────────────────
// Apply Promo Code to Ride
// ─────────────────────────────────────────────

export async function applyPromoService(payload: Payload, rideId: number, data: ApplyPromoDTO) {
    // Get ride
    const ride = await prisma.ride.findUnique({
        where: { id: rideId },
    });

    if (!ride) throw new NotFoundError("Ride not found");

    if (ride.clientId !== payload.userId) {
        throw new ForbiddenError("You can only apply promo codes to your own rides");
    }

    if (!["REQUESTED", "ACCEPTED"].includes(ride.status)) {
        throw new ForbiddenError("Cannot apply promo code to a ride that has started or completed");
    }

    // Get promo code
    const promo = await prisma.promoCode.findUnique({
        where: { code: data.code },
    });

    if (!promo) throw new NotFoundError("Promo code not found");
    if (!promo.isActive) throw new ForbiddenError("Promo code is not active");
    if (promo.expiresAt && promo.expiresAt < new Date()) {
        throw new ForbiddenError("Promo code has expired");
    }
    if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
        throw new ForbiddenError("Promo code has reached its usage limit");
    }

    // Check if user already used this promo
    const existingUsage = await prisma.promoCodeUsage.findUnique({
        where: {
            promoCodeId_userId: {
                promoCodeId: promo.id,
                userId: payload.userId,
            },
        },
    });

    if (existingUsage) {
        throw new ConflictError("You have already used this promo code");
    }

    // Calculate discounted fare
    const originalFare = ride.systemFare ?? ride.fare ?? 0;
    let discountedFare: number;

    if (promo.discountType === "PERCENTAGE") {
        discountedFare = originalFare * (1 - promo.discountValue / 100);
    } else {
        discountedFare = Math.max(0, originalFare - promo.discountValue);
    }

    discountedFare = Math.round(discountedFare * 100) / 100;

    // Apply promo in a transaction
    const result = await prisma.$transaction(async (tx) => {
        // Update ride fare
        const updatedRide = await tx.ride.update({
            where: { id: rideId },
            data: { fare: discountedFare },
        });

        // Record usage
        await tx.promoCodeUsage.create({
            data: {
                promoCodeId: promo.id,
                userId: payload.userId,
                rideId,
            },
        });

        // Increment usage count
        await tx.promoCode.update({
            where: { id: promo.id },
            data: { currentUses: { increment: 1 } },
        });

        return {
            rideId,
            originalFare,
            discountedFare,
            discount: originalFare - discountedFare,
            promoCode: promo.code,
            discountType: promo.discountType,
            discountValue: promo.discountValue,
        };
    });

    return result;
}

// ─────────────────────────────────────────────
// Get All Promo Codes (Admin)
// ─────────────────────────────────────────────

export async function getPromoCodesService(query: GetPromoCodesQueryDTO) {
    const { isActive, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    const [promoCodes, total] = await Promise.all([
        prisma.promoCode.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { usages: true },
                },
            },
        }),
        prisma.promoCode.count({ where }),
    ]);

    return {
        promoCodes,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    };
}

// ─────────────────────────────────────────────
// Create Promo Code (Admin)
// ─────────────────────────────────────────────

export async function createPromoCodeService(data: CreatePromoDTO) {
    const existing = await prisma.promoCode.findUnique({
        where: { code: data.code },
    });

    if (existing) {
        throw new ConflictError("Promo code already exists");
    }

    const promo = await prisma.promoCode.create({
        data: {
            code: data.code,
            discountType: data.discountType,
            discountValue: data.discountValue,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            maxUses: data.maxUses ?? null,
            isActive: data.isActive,
        },
    });

    return promo;
}
