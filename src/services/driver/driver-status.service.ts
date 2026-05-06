import { ForbiddenError, NotFoundError } from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import { emitSocketEvent } from "@/lib/socket/emit";
import { DriverStatusDTO, NearbyDriversQueryDTO } from "./driver.schema";
import { filterDriversByRadius } from "./driver.utils";

type Payload = {
    userId: number;
    role: string;
};

// ─────────────────────────────────────────────
// Update Driver Status (Online/Offline)
// ─────────────────────────────────────────────

export async function updateDriverStatusService(payload: Payload, data: DriverStatusDTO) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can update status");
    }

    const driver = await prisma.driver.findUnique({
        where: { userId: payload.userId },
    });

    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    const updateData: any = {
        isOnline: data.isOnline,
        lastLocationUpdate: new Date(),
    };

    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;

    const updatedDriver = await prisma.driver.update({
        where: { userId: payload.userId },
        data: updateData,
    });

    // Broadcast status change via socket
    emitSocketEvent("drivers", "driver:status_changed", {
        driverId: updatedDriver.id,
        isOnline: updatedDriver.isOnline,
        latitude: updatedDriver.latitude,
        longitude: updatedDriver.longitude,
    });

    return {
        success: true,
        driver: {
            id: updatedDriver.id,
            isOnline: updatedDriver.isOnline,
            latitude: updatedDriver.latitude,
            longitude: updatedDriver.longitude,
            lastLocationUpdate: updatedDriver.lastLocationUpdate,
        },
    };
}

// ─────────────────────────────────────────────
// Get Online Drivers
// ─────────────────────────────────────────────

export async function getOnlineDriversService(query?: NearbyDriversQueryDTO) {
    const drivers = await prisma.driver.findMany({
        where: {
            isOnline: true,
            isApproved: true,
        },
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

    // If location provided, filter by radius
    if (query?.lat && query?.lng) {
        const driversWithDistance = filterDriversByRadius(
            drivers,
            query.lat,
            query.lng,
            query.radius
        );

        return {
            drivers: driversWithDistance.slice(0, query.limit),
            total: driversWithDistance.length,
        };
    }

    return {
        drivers,
        total: drivers.length,
    };
}

// ─────────────────────────────────────────────
// Get Nearby Drivers
// ─────────────────────────────────────────────

export async function getNearbyDriversService(query: NearbyDriversQueryDTO) {
    const drivers = await prisma.driver.findMany({
        where: {
            isOnline: true,
            isApproved: true,
            latitude: { not: null },
            longitude: { not: null },
        },
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

    const driversWithDistance = filterDriversByRadius(
        drivers,
        query.lat,
        query.lng,
        query.radius
    );

    return {
        drivers: driversWithDistance.slice(0, query.limit),
        total: driversWithDistance.length,
    };
}
