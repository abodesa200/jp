// rides.service.ts
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
import { prisma } from "@/lib/prisma";

type Payload = {
    userId: number;
    role: string;
};

// ─────────────────────────────────────────────
// Create Ride Service
// ─────────────────────────────────────────────

export async function createRideService(
    payload: Payload,
    data: CreateRideDTO
) {
    if (payload.role !== "CLIENT") {
        throw new ForbiddenError("Only clients can request rides");
    }

    const {
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
        serviceType,
        rideMode,
        rideFlow,
        couponCode,
        clientOffer,
        maxPassengers,
        ...rest
    } = data;

    // ─────────────────────────────
    // 1. Calculate base pricing
    // ─────────────────────────────

    const distance = calculateDistance(
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng
    );

    const systemFare = calculateFare(distance, serviceType, rideMode);
    const estimatedDuration = calculateEstimatedDuration(distance);

    let discountAmount = 0;
    let couponUsageData: null | {
        couponId: number;
        discountApplied: number;
    } = null;

    // ─────────────────────────────
    // 2. Apply coupon (if exists)
    // ─────────────────────────────

    if (couponCode) {
        const coupon = await prisma.coupon.findUnique({
            where: { code: couponCode },
        });

        if (!coupon || !coupon.isActive) {
            throw new BadRequestError("Invalid coupon");
        }

        const now = new Date();

        if (coupon.startsAt && coupon.startsAt > now) {
            throw new BadRequestError("Coupon not active yet");
        }

        if (coupon.expiresAt && coupon.expiresAt < now) {
            throw new BadRequestError("Coupon expired");
        }

        if (coupon.minFare && systemFare < Number(coupon.minFare)) {
            throw new BadRequestError("Ride does not meet minimum fare");
        }

        // ───── calculate discount
        if (coupon.discountType === "PERCENTAGE") {
            discountAmount =
                (systemFare * Number(coupon.discountValue)) / 100;

            if (coupon.maxDiscount) {
                discountAmount = Math.min(
                    discountAmount,
                    Number(coupon.maxDiscount)
                );
            }
        } else {
            discountAmount = Number(coupon.discountValue);
        }

        discountAmount = Math.min(discountAmount, systemFare);

        couponUsageData = {
            couponId: coupon.id,
            discountApplied: discountAmount,
        };
    }

    // ─────────────────────────────
    // 3. Final fare
    // ─────────────────────────────

    const finalFare = systemFare - discountAmount;

    // ─────────────────────────────
    // 4. Create ride
    // ─────────────────────────────

    const ride = await ridesRepository.createRide(payload.userId, {
        ...rest,
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
        serviceType,
        rideMode,
        rideFlow,
        clientOffer,
        maxPassengers,
        // ensure required field for repository
        availableSeats: typeof maxPassengers === 'number' ? maxPassengers : 1,

        distance,
        systemFare,
        duration: estimatedDuration,
        discountAmount,
        finalFare,
    });

    // ─────────────────────────────
    // 5. Save coupon usage (after ride created)
    // ─────────────────────────────

    if (couponUsageData) {
        await prisma.couponUsage.create({
            data: {
                couponId: couponUsageData.couponId,
                userId: payload.userId,
                rideId: ride.id,
                discountApplied: couponUsageData.discountApplied,
            },
        });
    }

    // ─────────────────────────────
    // 6. Emit event
    // ─────────────────────────────

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
    query: GetRidesQueryDTO,
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
    query: GetNearbyRidesQueryDTO,
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
            "Driver location not available. Please update your location.",
        );
    }

    const { maxDistance, limit } = query;

    const availableRides = await ridesRepository.getAvailableRides();

    const ridesWithDistance = availableRides
        .map((ride) => {
            const distance = calculateDistance(
                driver.latitude!,
                driver.longitude!,
                ride.pickupLat,
                ride.pickupLng,
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

    if (isClient || isAdmin) {
        return { ride };
    }

    if (isDriver) {
        const canAccess =
            ride.status === "REQUESTED" || ride.driver?.userId === payload.userId;

        if (!canAccess) {
            throw new ForbiddenError("You don't have access to this ride");
        }

        return { ride };
    }

    throw new ForbiddenError("You don't have access to this ride");
}