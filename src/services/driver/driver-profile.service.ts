import { ForbiddenError, NotFoundError } from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import { UpdateDriverProfileDTO } from "./driver.schema";

type Payload = {
    userId: number;
    role: string;
};

// ─────────────────────────────────────────────
// Get Driver Profile (Current User)
// ─────────────────────────────────────────────

export async function getDriverProfileService(payload: Payload) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can access driver profile");
    }

    const driver = await prisma.driver.findUnique({
        where: { userId: payload.userId },
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
    });

    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    return driver;
}

// ─────────────────────────────────────────────
// Update Driver Profile (Current User)
// ─────────────────────────────────────────────

export async function updateDriverProfileService(payload: Payload, data: UpdateDriverProfileDTO) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can update driver profile");
    }

    const driver = await prisma.driver.findUnique({
        where: { userId: payload.userId },
    });

    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    const updateData: any = {};
    if (data.licenseNumber !== undefined) updateData.licenseNumber = data.licenseNumber;
    if (data.carModel !== undefined) updateData.carModel = data.carModel;
    if (data.carPlate !== undefined) updateData.carPlate = data.carPlate;
    if (data.carColor !== undefined) updateData.carColor = data.carColor;
    if (data.carYear !== undefined) updateData.carYear = data.carYear;
    if (data.isOnline !== undefined) updateData.isOnline = data.isOnline;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;

    // Update lastLocationUpdate if location changed
    if (data.latitude !== undefined || data.longitude !== undefined) {
        updateData.lastLocationUpdate = new Date();
    }

    const updatedDriver = await prisma.driver.update({
        where: { userId: payload.userId },
        data: updateData,
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
    });

    return updatedDriver;
}
