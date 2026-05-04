/**
 * Ride Status Service
 * Handles ride status changes (accept, cancel, complete)
 */

import { emitSocketEvent } from "@/lib/socket/emit";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../../core/errors";
import { rideRepository } from "../ride.repository";

export async function acceptRide(rideId: number, userId: number, role: string) {
    if (role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can accept rides");
    }

    const ride = await rideRepository.findById(rideId);

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    if (ride.status !== "REQUESTED") {
        throw new BadRequestError("Ride is not available");
    }

    const updatedRide = await rideRepository.update(rideId, {
        driverId: userId,
        status: "ACCEPTED",
        acceptedAt: new Date(),
    });

    // Notify client
    emitSocketEvent(`client:${ride.clientId}`, "ride:accepted", {
        rideId: updatedRide.id,
        driverId: userId,
    });

    return { ride: updatedRide };
}

export async function cancelRide(rideId: number, userId: number, role: string) {
    const ride = await rideRepository.findById(rideId);

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    const isClient = ride.clientId === userId;
    const isDriver = ride.driverId === userId;

    if (!isClient && !isDriver) {
        throw new ForbiddenError("No permission to cancel this ride");
    }

    if (ride.status === "COMPLETED" || ride.status === "CANCELLED") {
        throw new BadRequestError("Cannot cancel this ride");
    }

    const updatedRide = await rideRepository.update(rideId, {
        status: "CANCELLED",
        cancelledAt: new Date(),
    });

    // Notify the other party
    if (isClient && ride.driverId) {
        emitSocketEvent(`driver:${ride.driverId}`, "ride:cancelled", {
            rideId: updatedRide.id,
        });
    } else if (isDriver) {
        emitSocketEvent(`client:${ride.clientId}`, "ride:cancelled", {
            rideId: updatedRide.id,
        });
    }

    return { ride: updatedRide };
}
