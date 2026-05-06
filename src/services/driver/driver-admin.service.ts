import { ConflictError, ForbiddenError, NotFoundError } from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import { CreateDriverDTO, GetDriversQueryDTO, UpdateDriverDTO } from "./driver.schema";

// ─────────────────────────────────────────────
// Get Drivers List (Admin)
// ─────────────────────────────────────────────

export async function getDriversService(query: GetDriversQueryDTO) {
    const { isApproved, isOnline, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (isApproved !== undefined) where.isApproved = isApproved;
    if (isOnline !== undefined) where.isOnline = isOnline;

    const [drivers, total] = await Promise.all([
        prisma.driver.findMany({
            where,
            skip,
            take: limit,
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
            orderBy: { createdAt: "desc" },
        }),
        prisma.driver.count({ where }),
    ]);

    return {
        drivers,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    };
}

// ─────────────────────────────────────────────
// Get Driver by ID (Admin)
// ─────────────────────────────────────────────

export async function getDriverByIdService(driverId: number) {
    const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatarUrl: true,
                    role: true,
                    isVerified: true,
                    createdAt: true,
                },
            },
            rides: {
                select: {
                    id: true,
                    status: true,
                    createdAt: true,
                },
                take: 5,
                orderBy: { createdAt: "desc" },
            },
        },
    });

    if (!driver) {
        throw new NotFoundError("Driver not found");
    }

    return driver;
}

// ─────────────────────────────────────────────
// Create Driver (Admin)
// ─────────────────────────────────────────────

export async function createDriverService(data: CreateDriverDTO) {
    const { email, phone, name, licenseNumber, carModel, carPlate, carColor, carYear, isApproved } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                phone ? { phone } : undefined,
                email ? { email } : undefined,
            ].filter(Boolean) as any,
        },
    });

    if (existingUser) {
        throw new ConflictError("User with this email or phone already exists");
    }

    // Check if license number or car plate already exists
    const existingDriver = await prisma.driver.findFirst({
        where: {
            OR: [
                { licenseNumber },
                { carPlate },
            ],
        },
    });

    if (existingDriver) {
        throw new ConflictError("Driver with this license number or car plate already exists");
    }

    // Create user and driver in a transaction
    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email,
                phone,
                name,
                role: "DRIVER",
                isVerified: true, // Admin-created drivers are auto-verified
            },
        });

        const driver = await tx.driver.create({
            data: {
                userId: user.id,
                licenseNumber,
                carModel,
                carPlate,
                carColor,
                carYear,
                isApproved,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
            },
        });

        return driver;
    });

    return result;
}

// ─────────────────────────────────────────────
// Update Driver (Admin)
// ─────────────────────────────────────────────

export async function updateDriverService(driverId: number, data: UpdateDriverDTO) {
    const driver = await prisma.driver.findUnique({
        where: { id: driverId },
    });

    if (!driver) {
        throw new NotFoundError("Driver not found");
    }

    // Check for conflicts if updating license or plate
    if (data.licenseNumber || data.carPlate) {
        const existingDriver = await prisma.driver.findFirst({
            where: {
                AND: [
                    { id: { not: driverId } },
                    {
                        OR: [
                            data.licenseNumber ? { licenseNumber: data.licenseNumber } : undefined,
                            data.carPlate ? { carPlate: data.carPlate } : undefined,
                        ].filter(Boolean) as any,
                    },
                ],
            },
        });

        if (existingDriver) {
            throw new ConflictError("License number or car plate already in use");
        }
    }

    const updateData: any = {};
    if (data.licenseNumber !== undefined) updateData.licenseNumber = data.licenseNumber;
    if (data.carModel !== undefined) updateData.carModel = data.carModel;
    if (data.carPlate !== undefined) updateData.carPlate = data.carPlate;
    if (data.carColor !== undefined) updateData.carColor = data.carColor;
    if (data.carYear !== undefined) updateData.carYear = data.carYear;
    if (data.isApproved !== undefined) updateData.isApproved = data.isApproved;
    if (data.isOnline !== undefined) updateData.isOnline = data.isOnline;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;

    // Update lastLocationUpdate if location changed
    if (data.latitude !== undefined || data.longitude !== undefined) {
        updateData.lastLocationUpdate = new Date();
    }

    const updatedDriver = await prisma.driver.update({
        where: { id: driverId },
        data: updateData,
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
    });

    // TODO: Send notification if driver was approved
    // if (data.isApproved === true && !driver.isApproved) {
    //     await sendNotification(driver.userId, "Your driver account has been approved!");
    // }

    return updatedDriver;
}

// ─────────────────────────────────────────────
// Delete Driver (Admin)
// ─────────────────────────────────────────────

export async function deleteDriverService(driverId: number) {
    const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        include: {
            rides: {
                where: {
                    status: {
                        in: ["REQUESTED", "ACCEPTED", "DRIVER_ARRIVED", "IN_PROGRESS"],
                    },
                },
            },
        },
    });

    if (!driver) {
        throw new NotFoundError("Driver not found");
    }

    // Check if driver has active rides
    if (driver.rides.length > 0) {
        throw new ForbiddenError("Cannot delete driver with active rides");
    }

    // Delete driver and update user role in a transaction
    await prisma.$transaction(async (tx) => {
        await tx.driver.delete({
            where: { id: driverId },
        });

        await tx.user.update({
            where: { id: driver.userId },
            data: { role: "CLIENT" },
        });
    });

    return { success: true, message: "Driver deleted successfully" };
}
