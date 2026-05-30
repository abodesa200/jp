import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// Get Dashboard Stats
// ─────────────────────────────────────────────

export async function getDashboardStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
        totalUsers,
        totalDrivers,
        totalRides,
        activeRides,
        completedRides,
        clientCancelledRides,
        driverCancelledRides,
        pendingDrivers,
        onlineDrivers,
        totalRevenue,
        recentUsers,
        recentDrivers,
        recentRides,
        topDrivers,
        latestRides,
    ] = await Promise.all([
        // Total users
        prisma.user.count({ where: { role: "CLIENT" } }),

        // Total drivers
        prisma.driver.count(),

        // Total rides
        prisma.ride.count(),

        // Active rides
        prisma.ride.count({
            where: {
                status: { in: ["REQUESTED", "ACCEPTED", "DRIVER_ARRIVED", "IN_PROGRESS"] },
            },
        }),

        // Completed rides
        prisma.ride.count({ where: { status: "COMPLETED" } }),

        // Cancelled rides
        prisma.ride.count({ where: { status: "CLIENT_CANCELLED" } }),
        prisma.ride.count({ where: { status: "DRIVER_CANCELLED" } }),

        // Pending drivers
        prisma.driver.count({ where: { isApproved: false } }),

        // Online drivers
        prisma.driver.count({ where: { isOnline: true, isApproved: true } }),

        // Total revenue
        prisma.ride.aggregate({
            where: { status: "COMPLETED" },
            _sum: { fare: true },
        }),

        // Recent users (last 7 days)
        prisma.user.count({
            where: { createdAt: { gte: sevenDaysAgo }, role: "CLIENT" },
        }),

        // Recent drivers (last 7 days)
        prisma.driver.count({
            where: { createdAt: { gte: sevenDaysAgo } },
        }),

        // Recent rides (last 7 days)
        prisma.ride.count({
            where: { createdAt: { gte: sevenDaysAgo } },
        }),

        // Top drivers
        prisma.driver.findMany({
            where: { totalRides: { gt: 0 } },
            orderBy: { rating: "desc" },
            take: 5,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        avatarUrl: true,
                    },
                },
            },
        }),

        // Latest rides
        prisma.ride.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
                client: {
                    select: { id: true, name: true, phone: true },
                },
                driver: {
                    include: {
                        user: {
                            select: { id: true, name: true, phone: true },
                        },
                    },
                },
            },
        }),
    ]);

    return {
        overview: {
            totalUsers,
            totalDrivers,
            totalRides,
            activeRides,
            completedRides,
            cancelledRides: clientCancelledRides + driverCancelledRides,
            pendingDrivers,
            onlineDrivers,
            totalRevenue: totalRevenue._sum.fare || 0,
        },
        recent: {
            users: recentUsers,
            drivers: recentDrivers,
            rides: recentRides,
        },
        topDrivers,
        latestRides,
    };
}

// ─────────────────────────────────────────────
// Get User Stats
// ─────────────────────────────────────────────

export async function getUserStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, verified, unverified, recentGrowth] = await Promise.all([
        prisma.user.count({ where: { role: "CLIENT" } }),
        prisma.user.count({ where: { role: "CLIENT", isVerified: true } }),
        prisma.user.count({ where: { role: "CLIENT", isVerified: false } }),
        prisma.user.count({
            where: { role: "CLIENT", createdAt: { gte: thirtyDaysAgo } },
        }),
    ]);

    return {
        total,
        verified,
        unverified,
        recentGrowth,
    };
}

// ─────────────────────────────────────────────
// Get Driver Stats
// ─────────────────────────────────────────────

export async function getDriverStats() {
    const [total, approved, pending, online, offline] = await Promise.all([
        prisma.driver.count(),
        prisma.driver.count({ where: { isApproved: true } }),
        prisma.driver.count({ where: { isApproved: false } }),
        prisma.driver.count({ where: { isOnline: true, isApproved: true } }),
        prisma.driver.count({ where: { isOnline: false, isApproved: true } }),
    ]);

    return {
        total,
        approved,
        pending,
        online,
        offline,
    };
}

// ─────────────────────────────────────────────
// Get Ride Stats
// ─────────────────────────────────────────────

export async function getRideStats() {
    const [
        total,
        requested,
        accepted,
        inProgress,
        completed,
        clientCancelled,
        driverCancelled,
    ] = await Promise.all([
        prisma.ride.count(),
        prisma.ride.count({ where: { status: "REQUESTED" } }),
        prisma.ride.count({ where: { status: "ACCEPTED" } }),
        prisma.ride.count({ where: { status: "IN_PROGRESS" } }),
        prisma.ride.count({ where: { status: "COMPLETED" } }),
        prisma.ride.count({ where: { status: "CLIENT_CANCELLED" } }),
        prisma.ride.count({ where: { status: "DRIVER_CANCELLED" } }),
    ]);

    return {
        total,
        requested,
        accepted,
        inProgress,
        completed,
        cancelled: clientCancelled + driverCancelled,
    };
}

// ─────────────────────────────────────────────
// Get Revenue Stats
// ─────────────────────────────────────────────

export async function getRevenueStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const [total, daily, weekly, monthly] = await Promise.all([
        prisma.ride.aggregate({
            where: { status: "COMPLETED" },
            _sum: { fare: true },
        }),
        prisma.ride.aggregate({
            where: { status: "COMPLETED", completedAt: { gte: today } },
            _sum: { fare: true },
        }),
        prisma.ride.aggregate({
            where: { status: "COMPLETED", completedAt: { gte: thisWeek } },
            _sum: { fare: true },
        }),
        prisma.ride.aggregate({
            where: { status: "COMPLETED", completedAt: { gte: thisMonth } },
            _sum: { fare: true },
        }),
    ]);

    return {
        total: total._sum.fare || 0,
        daily: daily._sum.fare || 0,
        weekly: weekly._sum.fare || 0,
        monthly: monthly._sum.fare || 0,
    };
}

export const statsRepository = {
    getDashboardStats,
    getUserStats,
    getDriverStats,
    getRideStats,
    getRevenueStats,
};
