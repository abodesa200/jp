import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Payload = {
    userId: number;
    role: string;
};

export const rideHistoryQuerySchema = z.object({
    status: z.enum(["REQUESTED", "ACCEPTED", "DRIVER_ARRIVED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
    type: z.enum(["STANDARD", "CARPOOLING"]).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type RideHistoryQueryDTO = z.infer<typeof rideHistoryQuerySchema>;

// ─────────────────────────────────────────────
// Get Ride History
// ─────────────────────────────────────────────

export async function getRideHistoryService(payload: Payload, query: RideHistoryQueryDTO) {
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

    if (payload.role === "DRIVER") {
        const driver = await prisma.driver.findUnique({
            where: { userId: payload.userId },
            select: { id: true },
        });
        where.driverId = driver?.id;
    } else {
        where.clientId = payload.userId;
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

    return {
        rides,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    };
}

// ─────────────────────────────────────────────
// Export Ride History as CSV
// ─────────────────────────────────────────────

export async function exportRideHistoryService(payload: Payload, query: RideHistoryQueryDTO) {
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

    if (payload.role === "DRIVER") {
        const driver = await prisma.driver.findUnique({
            where: { userId: payload.userId },
            select: { id: true },
        });
        where.driverId = driver?.id;
    } else {
        where.clientId = payload.userId;
    }

    const rides = await prisma.ride.findMany({
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

    // Build CSV
    const headers = [
        "ID", "Date", "Status", "Type",
        "Pickup", "Dropoff",
        "Fare", "Distance (km)", "Duration (min)",
        "Payment Method", "Payment Status",
        "Client", "Driver", "Car",
    ];

    const rows = rides.map((ride) => [
        ride.id,
        ride.createdAt.toISOString(),
        ride.status,
        ride.type,
        ride.pickupAddress ?? `${ride.pickupLat},${ride.pickupLng}`,
        ride.dropoffAddress ?? `${ride.dropoffLat},${ride.dropoffLng}`,
        ride.fare ?? "",
        ride.distance ?? "",
        ride.duration ? Math.round(ride.duration / 60) : "",
        ride.payment?.method ?? "",
        ride.payment?.status ?? "",
        ride.client?.name ?? "",
        ride.driver?.user?.name ?? "",
        ride.driver?.carModel ?? "",
    ]);

    const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    return csv;
}

// ─────────────────────────────────────────────
// Admin Rides Report
// ─────────────────────────────────────────────

export async function getAdminRidesReportService(query: RideHistoryQueryDTO) {
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

    return {
        rides,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
        summary: {
            totalRides: total,
            completedRides: aggregates._count.id,
            totalRevenue: aggregates._sum.fare ?? 0,
            totalDistance: aggregates._sum.distance ?? 0,
            averageFare: aggregates._avg.fare ?? 0,
            averageDistance: aggregates._avg.distance ?? 0,
            averageDuration: aggregates._avg.duration
                ? Math.round(aggregates._avg.duration / 60)
                : 0,
        },
    };
}
