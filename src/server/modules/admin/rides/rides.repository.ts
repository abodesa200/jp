import { prisma } from "@/lib/prisma";
import { GetRidesQueryDTO, UpdateRideDTO } from "./rides.schema";

// ─────────────────────────────────────────────
// Get Rides
// ─────────────────────────────────────────────

export async function getRides(query: GetRidesQueryDTO) {
    const skip = (query.page - 1) * query.limit;

    const where: any = {};

    // Filter by status
    if (query.status !== "all") {
        where.status = query.status;
    }

    // Filter by type
    if (query.type !== "all") {
        where.type = query.type;
    }

    // Search by client name or phone
    if (query.search) {
        where.client = {
            OR: [
                { name: { contains: query.search, mode: "insensitive" } },
                { phone: { contains: query.search } },
                { email: { contains: query.search, mode: "insensitive" } },
            ],
        };
    }

    // Date range filter
    if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) {
            where.createdAt.gte = new Date(query.startDate);
        }
        if (query.endDate) {
            where.createdAt.lte = new Date(query.endDate);
        }
    }

    const [rides, total] = await Promise.all([
        prisma.ride.findMany({
            where,
            skip,
            take: query.limit,
            orderBy: { createdAt: "desc" },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                    },
                },
                driver: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                payment: true,
                review: true,
            },
        }),
        prisma.ride.count({ where }),
    ]);

    return { rides, total };
}

// ─────────────────────────────────────────────
// Get Ride by ID
// ─────────────────────────────────────────────

export async function getRideById(rideId: number) {
    return prisma.ride.findUnique({
        where: { id: rideId },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatarUrl: true,
                    role: true,
                },
            },
            driver: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            avatarUrl: true,
                        },
                    },
                },
            },
            payment: true,
            review: true,
            negotiation: {
                include: {
                    history: true,
                },
            },
            passengers: {
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        },
                    },
                },
            },
        },
    });
}

// ─────────────────────────────────────────────
// Update Ride
// ─────────────────────────────────────────────

export async function updateRide(rideId: number, data: UpdateRideDTO) {
    return prisma.ride.update({
        where: { id: rideId },
        data,
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            driver: {
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
        },
    });
}

// ─────────────────────────────────────────────
// Delete Ride
// ─────────────────────────────────────────────

export async function deleteRide(rideId: number) {
    return prisma.ride.delete({
        where: { id: rideId },
    });
}

// ─────────────────────────────────────────────
// Assign Driver to Ride
// ─────────────────────────────────────────────

export async function assignDriver(rideId: number, driverId: number) {
    return prisma.ride.update({
        where: { id: rideId },
        data: {
            driverId,
            status: "ACCEPTED",
            acceptedAt: new Date(),
        },
        include: {
            client: true,
            driver: {
                include: {
                    user: true,
                },
            },
        },
    });
}

export const ridesRepository = {
    getRides,
    getRideById,
    updateRide,
    deleteRide,
    assignDriver,
};
