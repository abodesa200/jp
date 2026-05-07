import { prisma } from "@/lib/prisma";
import { CreatePaymentDTO, GetPaymentsQueryDTO, UpdatePaymentDTO } from "./payment.schema";

// ─────────────────────────────────────────────
// Find Ride with Payment
// ─────────────────────────────────────────────

export async function findRideWithPayment(rideId: number) {
    return prisma.ride.findUnique({
        where: { id: rideId },
        include: {
            payment: true,
        },
    });
}

// ─────────────────────────────────────────────
// Create Payment
// ─────────────────────────────────────────────

export async function createPayment(rideId: number, data: CreatePaymentDTO) {
    return prisma.payment.create({
        data: {
            rideId,
            amount: data.amount,
            method: data.method,
            status: "PENDING",
        },
        include: {
            ride: {
                select: {
                    id: true,
                    clientId: true,
                    driverId: true,
                    pickupAddress: true,
                    dropoffAddress: true,
                },
            },
        },
    });
}

// ─────────────────────────────────────────────
// Get Ride Payment
// ─────────────────────────────────────────────

export async function getRidePayment(rideId: number) {
    return prisma.payment.findUnique({
        where: { rideId },
        include: {
            ride: {
                select: {
                    id: true,
                    clientId: true,
                    driverId: true,
                    pickupAddress: true,
                    dropoffAddress: true,
                    completedAt: true,
                },
            },
        },
    });
}

// ─────────────────────────────────────────────
// Update Payment
// ─────────────────────────────────────────────

export async function updatePayment(rideId: number, data: UpdatePaymentDTO) {
    const updateData: any = {
        status: data.status,
    };

    if (data.transactionId) {
        updateData.transactionId = data.transactionId;
    }

    return prisma.payment.update({
        where: { rideId },
        data: updateData,
        include: {
            ride: {
                select: {
                    id: true,
                    clientId: true,
                    driverId: true,
                },
            },
        },
    });
}

// ─────────────────────────────────────────────
// Get My Payments
// ─────────────────────────────────────────────

export async function getMyPayments(
    userId: number,
    role: string,
    query: GetPaymentsQueryDTO
) {
    const { status, page, limit } = query;
    const skip = (page - 1) * limit;

    let where: any = {};

    if (role === "DRIVER") {
        // Get payments for rides I drove
        const driver = await prisma.driver.findUnique({
            where: { userId },
        });

        if (!driver) {
            return { payments: [], total: 0 };
        }

        where = {
            ride: {
                driverId: driver.id,
            },
        };
    } else {
        // Get payments for rides I requested
        where = {
            ride: {
                clientId: userId,
            },
        };
    }

    if (status) {
        where.status = status;
    }

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                ride: {
                    select: {
                        id: true,
                        clientId: true,
                        driverId: true,
                        pickupAddress: true,
                        dropoffAddress: true,
                        completedAt: true,
                    },
                },
            },
        }),
        prisma.payment.count({ where }),
    ]);

    return { payments, total };
}

// ─────────────────────────────────────────────
// Get All Payments (Admin)
// ─────────────────────────────────────────────

export async function getAllPayments(query: GetPaymentsQueryDTO) {
    const { status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
        where.status = status;
    }

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                ride: {
                    select: {
                        id: true,
                        clientId: true,
                        driverId: true,
                        pickupAddress: true,
                        dropoffAddress: true,
                        completedAt: true,
                        client: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                        driver: {
                            select: {
                                id: true,
                                userId: true,
                                user: {
                                    select: {
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }),
        prisma.payment.count({ where }),
    ]);

    return { payments, total };
}

// ─────────────────────────────────────────────
// Find Ride Basic Info
// ─────────────────────────────────────────────

export async function findRideBasicInfo(rideId: number) {
    return prisma.ride.findUnique({
        where: { id: rideId },
        select: {
            id: true,
            clientId: true,
            driverId: true,
        },
    });
}
