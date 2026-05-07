import { prisma } from "@/lib/prisma";
import { RideHistoryQueryDTO } from "./history.schema";

// ─────────────────────────────────────────────
// Get Ride History
// ─────────────────────────────────────────────

export async function getRideHistory(
    userId: number,
    role: string,
    query: RideHistoryQueryDTO
) {
    const { status, type, startDate, endDate, page, limit } = query;
    const skip = (page - 1) * limit;

    const dateFilter: any = {};
    if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    let where: any = {
        ...dateFilter,
        ...(status && { status }),
        ...(type && { type }),
    };

    if (role === "DRIVER") {
        const driver = await prisma.driver.findUnique({
            where: { userId },
            select: { id: true },
        });
        where.driverId = driver?.id;
    } else {
        where.clientId = userId;
    }

    const [rides, total] = await Promise.all([
        prisma.ride.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                driver: {
                    select: {
                        id: true,
                        carModel: true,
                        rating: true,
                        user: { select: { name: true, avatarUrl: true } },
                    },
                },
                client: {
                    select: { id: true, name: true, avatarUrl: true },
                },
                payment: {
                    select: { amount: true, method: true, status: true },
                },
                review: {
                    select: { rating: true, comment: true },
                },
            },
        }),
        prisma.ride.count({ where }),
    ]);

    return { rides, total };
}

// ─────────────────────────────────────────────
// Export Ride History
// ─────────────────────────────────────────────

export async function exportRideHistory(
    userId: number,
    role: string,
    query: RideHistoryQueryDTO
) {
    const { status, type, startDate, endDate } = query;

    const dateFilter: any = {};
    if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    let where: any = {
        ...dateFilter,
        ...(status && { status }),
        ...(type && { type }),
    };

    if (role === "DRIVER") {
        const driver = await prisma.driver.findUnique({
            where: { userId },
            select: { id: true },
        });
        where.driverId = driver?.id;
    } else {
        where.clientId = userId;
    }

    return prisma.ride.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            driver: {
                select: {
                    user: { select: { name: true } },
                    carModel: true,
                },
            },
            client: { select: { name: true } },
            payment: { select: { amount: true, method: true, status: true } },
        },
    });
}

// ─────────────────────────────────────────────
// Admin Rides Report
// ─────────────────────────────────────────────

export async function getAdminRidesReport(query: RideHistoryQueryDTO) {
    const { status, type, startDate, endDate, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {
        ...(status && { status }),
        ...(type && { type }),
    };

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [rides, total, aggregates] = await Promise.all([
        prisma.ride.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                client: { select: { id: true, name: true, email: true } },
                driver: {
                    select: {
                        id: true,
                        carModel: true,
                        user: { select: { name: true } },
                    },
                },
                payment: { select: { amount: true, method: true, status: true } },
            },
        }),
        prisma.ride.count({ where }),
        prisma.ride.aggregate({
            where: { ...where, status: "COMPLETED" },
            _sum: { fare: true, distance: true },
            _avg: { fare: true, distance: true, duration: true },
            _count: { id: true },
        }),
    ]);

    return { rides, total, aggregates };
}
