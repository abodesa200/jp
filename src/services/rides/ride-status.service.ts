import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import { emitSocketEvent } from "@/lib/socket/emit";
import { CancelRideDTO, UpdateRideStatusDTO } from "./ride.schema";

type Payload = {
    userId: number;
    role: string;
};

/**
 * Update ride status (ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED)
 * Updates timestamps automatically based on status
 */
export async function updateRideStatusService(
    payload: Payload,
    rideId: string,
    data: UpdateRideStatusDTO
) {
    const ride = await prisma.ride.findUnique({
        where: { id: parseInt(rideId) },
        include: {
            driver: {
                include: {
                    user: true,
                },
            },
        },
    });

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    // التحقق من الصلاحيات
    const isClient = ride.clientId === payload.userId;
    const isDriver = ride.driver?.userId === payload.userId;
    const isAdmin = payload.role === "ADMIN";

    if (!isClient && !isDriver && !isAdmin) {
        throw new ForbiddenError("You don't have access to this ride");
    }

    const { status, cancelReason } = data;

    const updateData: any = { status };

    // تحديث timestamps حسب الحالة
    if (status === "ACCEPTED" && !ride.acceptedAt) {
        updateData.acceptedAt = new Date();
    } else if (status === "IN_PROGRESS" && !ride.startedAt) {
        updateData.startedAt = new Date();
    } else if (status === "COMPLETED" && !ride.completedAt) {
        updateData.completedAt = new Date();
    } else if (status === "CANCELLED") {
        updateData.cancelledAt = new Date();
        if (cancelReason) {
            updateData.cancelReason = cancelReason;
        }
    }

    const updatedRide = await prisma.ride.update({
        where: { id: parseInt(rideId) },
        data: updateData,
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
    });

    // Emit socket events
    const notifyUserId = isClient ? ride.driver?.userId : ride.clientId;
    if (notifyUserId) {
        emitSocketEvent(`user:${notifyUserId}`, `ride:${status.toLowerCase()}`, {
            ride: updatedRide,
        });
    }
    emitSocketEvent(`ride:${rideId}`, `ride:${status.toLowerCase()}`, {
        ride: updatedRide,
    });

    return { ride: updatedRide };
}

/**
 * Accept a ride (driver only)
 * Uses atomic update to prevent race conditions
 */
export async function acceptRideService(payload: Payload, rideId: string) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can accept rides");
    }

    const driver = await prisma.driver.findUnique({
        where: { userId: payload.userId },
    });

    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    if (!driver.isApproved) {
        throw new ForbiddenError("Your driver account is not approved yet");
    }

    if (!driver.isOnline) {
        throw new BadRequestError("You must be online to accept rides");
    }

    // RACE CONDITION FIX: Atomic update
    const updatedRide = await prisma.ride.updateMany({
        where: {
            id: parseInt(rideId),
            status: "REQUESTED",
            driverId: null,
        },
        data: {
            driverId: driver.id,
            status: "ACCEPTED",
            acceptedAt: new Date(),
        },
    });

    if (updatedRide.count === 0) {
        const existingRide = await prisma.ride.findUnique({
            where: { id: parseInt(rideId) },
            select: { status: true, driverId: true },
        });

        if (!existingRide) {
            throw new NotFoundError("Ride not found");
        }

        if (existingRide.driverId && existingRide.driverId !== driver.id) {
            throw new ConflictError("Ride already accepted by another driver");
        }

        throw new BadRequestError(
            `Ride is already ${existingRide.status.toLowerCase()}`
        );
    }

    // Fetch full ride details
    const ride = await prisma.ride.findUnique({
        where: { id: parseInt(rideId) },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
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
                            phone: true,
                            avatarUrl: true,
                        },
                    },
                },
            },
        },
    });

    // Emit socket events
    emitSocketEvent(`user:${ride!.clientId}`, "ride:accepted", { ride });
    emitSocketEvent(`ride:${rideId}`, "ride:accepted", { ride });

    return { ride };
}

/**
 * Cancel a ride (client or driver)
 * Records who cancelled and the reason
 */
export async function cancelRideService(
    payload: Payload,
    rideId: string,
    data: CancelRideDTO
) {
    const ride = await prisma.ride.findUnique({
        where: { id: parseInt(rideId) },
        include: {
            driver: {
                include: {
                    user: true,
                },
            },
        },
    });

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    const isClient = ride.clientId === payload.userId;
    const isDriver = ride.driver?.userId === payload.userId;

    if (!isClient && !isDriver) {
        throw new ForbiddenError("You don't have permission to cancel this ride");
    }

    if (ride.status === "COMPLETED") {
        throw new BadRequestError("Cannot cancel a completed ride");
    }

    if (ride.status === "CANCELLED") {
        throw new BadRequestError("Ride is already cancelled");
    }

    const cancelledBy = isClient ? "CLIENT" : "DRIVER";
    const cancelReason =
        data.reason || `Cancelled by ${cancelledBy.toLowerCase()}`;

    const updatedRide = await prisma.ride.update({
        where: { id: parseInt(rideId) },
        data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelReason: `[${cancelledBy}] ${cancelReason}`,
        },
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
    });

    // Notify the other party
    const notifyUserId = isClient ? ride.driver?.userId : ride.clientId;
    if (notifyUserId) {
        emitSocketEvent(`user:${notifyUserId}`, "ride:cancelled", {
            ride: updatedRide,
        });
    }
    emitSocketEvent(`ride:${rideId}`, "ride:cancelled", { ride: updatedRide });

    return { ride: updatedRide };
}
