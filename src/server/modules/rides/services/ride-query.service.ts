/**
 * Ride Query Service
 * Handles ride retrieval operations
 */

import { ForbiddenError, NotFoundError } from "../../../core/errors";
import { rideRepository } from "../ride.repository";
import { GetRidesQuery } from "../ride.types";

export async function getUserRides(userId: number, role: string, query: GetRidesQuery) {
    let result;

    if (role === "CLIENT") {
        result = await rideRepository.findByClientId(userId, query);
    } else if (role === "DRIVER") {
        result = await rideRepository.findByDriverId(userId, query);
    } else {
        throw new ForbiddenError("Invalid role");
    }

    return {
        rides: result.rides,
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / result.limit),
        },
    };
}

export async function getRideById(rideId: number, userId: number, role: string) {
    const ride = await rideRepository.findById(rideId, {
        client: true,
        driver: true,
        negotiation: {
            include: {
                history: true,
            },
        },
    });

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    // Check permissions
    const isClient = ride.clientId === userId;
    const isDriver = ride.driverId === userId;
    const isAdmin = role === "ADMIN";

    if (!isClient && !isDriver && !isAdmin) {
        throw new ForbiddenError("No access to this ride");
    }

    return { ride };
}
