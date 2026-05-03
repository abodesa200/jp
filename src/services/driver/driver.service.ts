import { prisma } from "@/lib/prisma";

export async function updateDriverInfo(userId: number, driverInfo: any) {
    const allowedFields = ["carModel", "carPlate", "carColor", "carYear"];

    const data: Record<string, unknown> = {};

    for (const field of allowedFields) {
        if (driverInfo[field] !== undefined) {
            data[field] = driverInfo[field];
        }
    }

    if (Object.keys(data).length === 0) return null;

    return prisma.driver.update({
        where: { userId },
        data,
        select: {
            id: true,
            carModel: true,
            carPlate: true,
            carColor: true,
            carYear: true,
            licenseNumber: true,
            isApproved: true,
            isOnline: true,
            rating: true,
            totalRides: true,
        },
    });
}

export async function updateDriverLocation(
    userId: number,
    latitude: number,
    longitude: number
) {
    return prisma.driver.update({
        where: { userId },
        data: {
            latitude,
            longitude,
            lastLocationUpdate: new Date(),
        },
        select: {
            id: true,
            latitude: true,
            longitude: true,
            lastLocationUpdate: true,
        },
    });
}