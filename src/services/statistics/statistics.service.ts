import { prisma } from "@/lib/prisma";
import { StatisticsQueryDTO } from "./statistics.schema";

// ─────────────────────────────────────────────
// Get Ride Statistics
// ─────────────────────────────────────────────

export async function getRideStatisticsService(query: StatisticsQueryDTO) {
    const { period, startDate, endDate } = query;

    const where: any = {};

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Total rides by status
    const ridesByStatus = await prisma.ride.groupBy({
        by: ["status"],
        where,
        _count: {
            id: true,
        },
    });

    // Total rides by type
    const ridesByType = await prisma.ride.groupBy({
        by: ["type"],
        where,
        _count: {
            id: true,
        },
    });

    // Average ride metrics
    const metrics = await prisma.ride.aggregate({
        where: {
            ...where,
            status: "COMPLETED",
        },
        _avg: {
            fare: true,
            distance: true,
            duration: true,
        },
        _sum: {
            fare: true,
            distance: true,
        },
        _count: {
            id: true,
        },
    });

    // Rides over time (grouped by period)
    let ridesOverTime: any[] = [];

    if (period === "daily") {
        ridesOverTime = await prisma.$queryRaw`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
            FROM "Ride"
            ${where.createdAt ? prisma.$queryRaw`WHERE created_at >= ${where.createdAt.gte} AND created_at <= ${where.createdAt.lte}` : prisma.$queryRaw``}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        `;
    }

    return {
        summary: {
            totalRides: ridesByStatus.reduce((sum, item) => sum + item._count.id, 0),
            completedRides: ridesByStatus.find((s) => s.status === "COMPLETED")?._count.id || 0,
            cancelledRides: ridesByStatus.find((s) => s.status === "CANCELLED")?._count.id || 0,
            activeRides: ridesByStatus.find((s) => s.status === "IN_PROGRESS")?._count.id || 0,
        },
        byStatus: ridesByStatus.map((item) => ({
            status: item.status,
            count: item._count.id,
        })),
        byType: ridesByType.map((item) => ({
            type: item.type,
            count: item._count.id,
        })),
        metrics: {
            averageFare: metrics._avg.fare || 0,
            averageDistance: metrics._avg.distance || 0,
            averageDuration: metrics._avg.duration || 0,
            totalRevenue: metrics._sum.fare || 0,
            totalDistance: metrics._sum.distance || 0,
        },
        overTime: ridesOverTime,
    };
}

// ─────────────────────────────────────────────
// Get Revenue Statistics
// ─────────────────────────────────────────────

export async function getRevenueStatisticsService(query: StatisticsQueryDTO) {
    const { startDate, endDate } = query;

    const where: any = {
        status: "PAID",
    };

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Total revenue by payment method
    const revenueByMethod = await prisma.payment.groupBy({
        by: ["method"],
        where,
        _sum: {
            amount: true,
        },
        _count: {
            id: true,
        },
    });

    // Overall revenue metrics
    const metrics = await prisma.payment.aggregate({
        where,
        _sum: {
            amount: true,
        },
        _avg: {
            amount: true,
        },
        _count: {
            id: true,
        },
    });

    // Revenue by status
    const revenueByStatus = await prisma.payment.groupBy({
        by: ["status"],
        _sum: {
            amount: true,
        },
        _count: {
            id: true,
        },
    });

    return {
        summary: {
            totalRevenue: metrics._sum.amount || 0,
            averageTransaction: metrics._avg.amount || 0,
            totalTransactions: metrics._count.id,
        },
        byMethod: revenueByMethod.map((item) => ({
            method: item.method,
            revenue: item._sum.amount || 0,
            count: item._count.id,
        })),
        byStatus: revenueByStatus.map((item) => ({
            status: item.status,
            revenue: item._sum.amount || 0,
            count: item._count.id,
        })),
    };
}

// ─────────────────────────────────────────────
// Get Driver Statistics
// ─────────────────────────────────────────────

export async function getDriverStatisticsService() {
    // Total drivers
    const totalDrivers = await prisma.driver.count();

    // Approved drivers
    const approvedDrivers = await prisma.driver.count({
        where: { isApproved: true },
    });

    // Online drivers
    const onlineDrivers = await prisma.driver.count({
        where: {
            isOnline: true,
            isApproved: true,
        },
    });

    // Average rating
    const ratingMetrics = await prisma.driver.aggregate({
        where: { isApproved: true },
        _avg: {
            rating: true,
            totalRides: true,
        },
    });

    // Top rated drivers
    const topDrivers = await prisma.driver.findMany({
        where: {
            isApproved: true,
            totalRides: {
                gte: 5,
            },
        },
        orderBy: {
            rating: "desc",
        },
        take: 10,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                },
            },
        },
    });

    // Drivers by approval status
    const driversByStatus = await prisma.driver.groupBy({
        by: ["isApproved"],
        _count: {
            id: true,
        },
    });

    return {
        summary: {
            totalDrivers,
            approvedDrivers,
            pendingDrivers: totalDrivers - approvedDrivers,
            onlineDrivers,
            averageRating: ratingMetrics._avg.rating || 0,
            averageRidesPerDriver: ratingMetrics._avg.totalRides || 0,
        },
        topDrivers: topDrivers.map((driver) => ({
            id: driver.id,
            name: driver.user.name,
            avatarUrl: driver.user.avatarUrl,
            rating: driver.rating,
            totalRides: driver.totalRides,
            carModel: driver.carModel,
        })),
        byStatus: driversByStatus.map((item) => ({
            isApproved: item.isApproved,
            count: item._count.id,
        })),
    };
}

// ─────────────────────────────────────────────
// Get User Statistics
// ─────────────────────────────────────────────

export async function getUserStatisticsService(query: StatisticsQueryDTO) {
    const { startDate, endDate } = query;

    const where: any = {};

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Total users by role
    const usersByRole = await prisma.user.groupBy({
        by: ["role"],
        _count: {
            id: true,
        },
    });

    // New users in period
    const newUsers = await prisma.user.count({ where });

    // Verified users
    const verifiedUsers = await prisma.user.count({
        where: { isVerified: true },
    });

    // Active users (users with at least one ride)
    const activeClients = await prisma.user.count({
        where: {
            role: "CLIENT",
            rides: {
                some: {},
            },
        },
    });

    const activeDrivers = await prisma.driver.count({
        where: {
            rides: {
                some: {},
            },
        },
    });

    return {
        summary: {
            totalUsers: usersByRole.reduce((sum, item) => sum + item._count.id, 0),
            newUsers,
            verifiedUsers,
            activeClients,
            activeDrivers,
        },
        byRole: usersByRole.map((item) => ({
            role: item.role,
            count: item._count.id,
        })),
    };
}
