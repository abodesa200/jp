import { prisma } from "@/lib/prisma";
import { GetDriversQueryDTO, UpdateDriverDTO } from "./drivers.schema";

// ─────────────────────────────────────────────
// Get Drivers
// ─────────────────────────────────────────────

export async function getDrivers(query: GetDriversQueryDTO) {
    const skip = (query.page - 1) * query.limit;

    const where: any = {};

    if (query.isApproved !== undefined) {
        where.isApproved = query.isApproved;
    }

    if (query.isOnline !== undefined) {
        where.isOnline = query.isOnline;
    }

    if (query.search) {
        where.OR = [
            { licenseNumber: { contains: query.search } },
            { carModel: { contains: query.search, mode: "insensitive" } },
            { carPlate: { contains: query.search, mode: "insensitive" } },
            {
                user: {
                    OR: [
                        { name: { contains: query.search, mode: "insensitive" } },
                        { email: { contains: query.search, mode: "insensitive" } },
                        { phone: { contains: query.search } },
                    ],
                },
            },
        ];
    }

    const [drivers, total] = await Promise.all([
        prisma.driver.findMany({
            where,
            skip,
            take: query.limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                        isVerified: true,
                        createdAt: true,
                    },
                },
                rides: {
                    take: 5,
                    orderBy: { createdAt: "desc" },
                },
            },
        }),
        prisma.driver.count({ where }),
    ]);

    return { drivers, total };
}

// ─────────────────────────────────────────────
// Get Driver by ID
// ─────────────────────────────────────────────

export async function getDriverById(driverId: number) {
    return prisma.driver.findUnique({
        where: { id: driverId },
        include: {
            user: true,
            rides: {
                take: 20,
                orderBy: { createdAt: "desc" },
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
            reviews: {
                take: 20,
                orderBy: { createdAt: "desc" },
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                        },
                    },
                },
            },
        },
    });
}

// ─────────────────────────────────────────────
// Update Driver
// ─────────────────────────────────────────────

export async function updateDriver(driverId: number, data: UpdateDriverDTO) {
    return prisma.driver.update({
        where: { id: driverId },
        data,
        include: {
            user: true,
        },
    });
}

// ─────────────────────────────────────────────
// Delete Driver
// ─────────────────────────────────────────────

export async function deleteDriver(driverId: number) {
    // This will also delete the user due to cascade
    return prisma.driver.delete({
        where: { id: driverId },
    });
}

// ─────────────────────────────────────────────
// Get Pending Drivers
// ─────────────────────────────────────────────

export async function getPendingDrivers() {
    return prisma.driver.findMany({
        where: { isApproved: false },
        orderBy: { createdAt: "asc" },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatarUrl: true,
                    createdAt: true,
                },
            },
        },
    });
}

export const driversRepository = {
    getDrivers,
    getDriverById,
    updateDriver,
    deleteDriver,
    getPendingDrivers,
};
