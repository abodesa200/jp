import {
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { ridesRepository } from "./rides.repository";
import {
    AssignDriverDTO,
    GetRidesQueryDTO,
    UpdateRideDTO,
} from "./rides.schema";

type JWTPayload = {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
};

// ─────────────────────────────────────────────
// Get Rides
// ─────────────────────────────────────────────

export async function getRidesService(
    payload: JWTPayload,
    query: GetRidesQueryDTO
) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const { rides, total } = await ridesRepository.getRides(query);

    return {
        rides,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

// ─────────────────────────────────────────────
// Get Ride by ID
// ─────────────────────────────────────────────

export async function getRideByIdService(payload: JWTPayload, rideId: number) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const ride = await ridesRepository.getRideById(rideId);

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    return { ride };
}

// ─────────────────────────────────────────────
// Update Ride
// ─────────────────────────────────────────────

export async function updateRideService(
    payload: JWTPayload,
    rideId: number,
    data: UpdateRideDTO
) {
    if (payload.role !== "ADMIN") {
        throw new ForbiddenError("Admin access required");
    }

    const ride = await ridesRepository.getRideById(rideId);

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    const updatedRide = await ridesRepository.updateRide(rideId, data);

    return {
        ride: updatedRide,
        message: "Ride updated successfully",
    };
}

// ─────────────────────────────────────────────
// Delete Ride
// ─────────────────────────────────────────────

export async function deleteRideService(payload: JWTPayload, rideId: number) {
    if (payload.role !== "ADMIN") {
        throw new ForbiddenError("Admin access required");
    }

    const ride = await ridesRepository.getRideById(rideId);

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    await ridesRepository.deleteRide(rideId);

    return {
        message: "Ride deleted successfully",
    };
}

// ─────────────────────────────────────────────
// Assign Driver to Ride
// ─────────────────────────────────────────────

export async function assignDriverService(
    payload: JWTPayload,
    rideId: number,
    data: AssignDriverDTO
) {
    if (payload.role !== "ADMIN") {
        throw new ForbiddenError("Admin access required");
    }

    const ride = await ridesRepository.getRideById(rideId);

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    if (ride.status !== "REQUESTED") {
        throw new ForbiddenError("Can only assign driver to requested rides");
    }

    const updatedRide = await ridesRepository.assignDriver(
        rideId,
        data.driverId
    );

    return {
        ride: updatedRide,
        message: "Driver assigned successfully",
    };
}
