import { ConflictError, ForbiddenError, NotFoundError } from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import { CreatePaymentDTO, GetPaymentsQueryDTO, UpdatePaymentDTO } from "./payment.schema";

type Payload = {
    userId: number;
    role: string;
};

// ─────────────────────────────────────────────
// Create Payment for Ride
// ─────────────────────────────────────────────

export async function createPaymentService(
    payload: Payload,
    rideId: number,
    data: CreatePaymentDTO
) {
    // Get ride details
    const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: {
            payment: true,
        },
    });

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    // Validate ride is completed
    if (ride.status !== "COMPLETED") {
        throw new ForbiddenError("Can only create payment for completed rides");
    }

    // Validate user is the client of this ride
    if (ride.clientId !== payload.userId) {
        throw new ForbiddenError("Only the ride client can create payment");
    }

    // Check if payment already exists
    if (ride.payment) {
        throw new ConflictError("Payment already exists for this ride");
    }

    // Create payment
    const payment = await prisma.payment.create({
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

    return payment;
}

// ─────────────────────────────────────────────
// Get Payment for Ride
// ─────────────────────────────────────────────

export async function getRidePaymentService(payload: Payload, rideId: number) {
    const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        select: {
            id: true,
            clientId: true,
            driverId: true,
        },
    });

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    // User must be client or driver of the ride (or admin)
    if (
        payload.role !== "ADMIN" &&
        ride.clientId !== payload.userId &&
        ride.driverId !== payload.userId
    ) {
        throw new ForbiddenError("You can only view payments for your own rides");
    }

    const payment = await prisma.payment.findUnique({
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

    if (!payment) {
        throw new NotFoundError("Payment not found for this ride");
    }

    return payment;
}

// ─────────────────────────────────────────────
// Update Payment Status
// ─────────────────────────────────────────────

export async function updatePaymentService(
    payload: Payload,
    rideId: number,
    data: UpdatePaymentDTO
) {
    const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: {
            payment: true,
        },
    });

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    if (!ride.payment) {
        throw new NotFoundError("Payment not found for this ride");
    }

    // Only client or driver can update payment
    if (ride.clientId !== payload.userId && ride.driverId !== payload.userId) {
        throw new ForbiddenError("You can only update payments for your own rides");
    }

    const updateData: any = {
        status: data.status,
    };

    if (data.transactionId) {
        updateData.transactionId = data.transactionId;
    }

    const payment = await prisma.payment.update({
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

    return payment;
}

// ─────────────────────────────────────────────
// Get My Payments
// ─────────────────────────────────────────────

export async function getMyPaymentsService(payload: Payload, query: GetPaymentsQueryDTO) {
    const { status, page, limit } = query;
    const skip = (page - 1) * limit;

    let where: any = {};

    if (payload.role === "DRIVER") {
        // Get payments for rides I drove
        const driver = await prisma.driver.findUnique({
            where: { userId: payload.userId },
        });

        if (!driver) {
            throw new NotFoundError("Driver profile not found");
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
                clientId: payload.userId,
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

    return {
        payments,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    };
}

// ─────────────────────────────────────────────
// Get All Payments (Admin)
// ─────────────────────────────────────────────

export async function getAllPaymentsService(query: GetPaymentsQueryDTO) {
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

    return {
        payments,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    };
}
