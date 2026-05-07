import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { emitSocketEvent } from "@/server/lib/socket/emit";
import * as ridesRepository from "./rides.repository";
import { CreateRideDTO, GetNearbyRidesQueryDTO, GetRidesQueryDTO } from "./rides.schema";
import {
    calculateDistance,
    calculateEstimatedDuration,
    calculateFare,
    mapRide,
} from "./rides.utils";

type Payload = {
    userId: number;
    role: string;
};

// ─────────────────────────────────────────────
// Create Ride Service
// ─────────────────────────────────────────────

export async function createRideService(payload: Payload, data: CreateRideDTO) {
    if (payload.role !== "CLIENT") {
        throw new ForbiddenError("Only clients can request rides");
    }

    const {
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
    } = data;

    const distance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
    const systemFare = calculateFare(distance);
    const estimatedDuration = calculateEstimatedDuration(distance);

    const ride = await ridesRepository.createRide(payload.userId, {
        ...data,
        distance,
        systemFare,
        estimatedDuration,
    });

    // Notify all online drivers about new ride
    emitSocketEvent("drivers", "ride:created", {
        ride: mapRide(ride),
    });

    return {
        ride: mapRide(ride),
    };
}

// ─────────────────────────────────────────────
// Get User Rides Service
// ─────────────────────────────────────────────

export async function getUserRidesService(
    payload: Payload,
    query: GetRidesQueryDTO
) {
    const { rides, total } = await ridesRepository.getUserRides(payload.userId, query);

    return {
        rides,
        pagination: {
            total,
            page: query.page,
            limit: query.limit,
            pages: Math.ceil(total / query.limit),
        },
    };
}

// ─────────────────────────────────────────────
// Get Nearby Rides Service
// ─────────────────────────────────────────────

export async function getNearbyRidesService(
    payload: Payload,
    query: GetNearbyRidesQueryDTO
) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can view nearby rides");
    }

    const driver = await ridesRepository.findDriverByUserId(payload.userId);

    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    if (!driver.isApproved) {
        throw new ForbiddenError("Driver account is not approved yet");
    }

    if (!driver.latitude || !driver.longitude) {
        throw new BadRequestError(
            "Driver location not available. Please update your location."
        );
    }

    const { maxDistance, limit } = query;

    // جلب الرحلات المتاحة (REQUESTED فقط)
    const availableRides = await ridesRepository.getAvailableRides();

    // حساب المسافة وفلترة
    const ridesWithDistance = availableRides
        .map((ride) => {
            const distance = calculateDistance(
                driver.latitude!,
                driver.longitude!,
                ride.pickupLat,
                ride.pickupLng
            );

            return {
                ...ride,
                distanceFromDriver: parseFloat(distance.toFixed(2)),
            };
        })
        .filter((ride) => ride.distanceFromDriver <= maxDistance)
        .sort((a, b) => a.distanceFromDriver - b.distanceFromDriver)
        .slice(0, limit);

    return {
        rides: ridesWithDistance,
        driverLocation: {
            lat: driver.latitude,
            lng: driver.longitude,
        },
        filters: {
            maxDistance,
            limit,
        },
    };
}

// ─────────────────────────────────────────────
// Get Ride Details Service
// ─────────────────────────────────────────────

export async function getRideDetailsService(payload: Payload, rideId: string) {
    const ride = await ridesRepository.findRideWithDetails(Number(rideId));

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    const isClient = ride.clientId === payload.userId;
    const isAdmin = payload.role === "ADMIN";
    const isDriver = payload.role === "DRIVER";

    // -------------------------
    // CLIENT + ADMIN
    // -------------------------
    if (isClient || isAdmin) {
        return { ride };
    }

    // -------------------------
    // DRIVER LOGIC
    // -------------------------
    if (isDriver) {
        const canAccess =
            ride.status === "REQUESTED" ||
            ride.driver?.userId === payload.userId;

        if (!canAccess) {
            throw new ForbiddenError("You don't have access to this ride");
        }

        return { ride };
    }

    // -------------------------
    // FALLBACK
    // -------------------------
    throw new ForbiddenError("You don't have access to this ride");
}
