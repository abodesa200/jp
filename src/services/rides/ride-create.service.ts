import { ForbiddenError } from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import { emitSocketEvent } from "@/lib/socket/emit";
import { CreateRideDTO } from "./ride.schema";
import {
    calculateDistance,
    calculateEstimatedDuration,
    calculateFare,
} from "./ride.utils";

type Payload = {
    userId: number;
    role: string;
};

/**
 * Create a new ride request
 * Only clients can create rides
 */
export async function createRideService(payload: Payload, data: CreateRideDTO) {
    if (payload.role !== "CLIENT") {
        throw new ForbiddenError("Only clients can request rides");
    }

    const {
        pickupLat,
        pickupLng,
        pickupAddress,
        dropoffLat,
        dropoffLng,
        dropoffAddress,
        type,
        maxPassengers,
    } = data;

    // حساب المسافة والسعر
    const distance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
    const systemFare = calculateFare(distance);
    const estimatedDuration = calculateEstimatedDuration(distance);

    // إنشاء الرحلة
    const ride = await prisma.ride.create({
        data: {
            clientId: payload.userId,
            pickupLat,
            pickupLng,
            pickupAddress,
            dropoffLat,
            dropoffLng,
            dropoffAddress,
            type: type as "STANDARD" | "CARPOOLING",
            maxPassengers,
            availableSeats: maxPassengers,
            systemFare,
            distance,
            duration: estimatedDuration,
            status: "REQUESTED",
        },
    });

    // Notify all online drivers about new ride
    emitSocketEvent("drivers", "ride:created", {
        ride: {
            id: ride.id,
            status: ride.status,
            pickup: {
                lat: ride.pickupLat,
                lng: ride.pickupLng,
                address: ride.pickupAddress,
            },
            dropoff: {
                lat: ride.dropoffLat,
                lng: ride.dropoffLng,
                address: ride.dropoffAddress,
            },
            systemFare: ride.systemFare,
            distance: ride.distance,
            estimatedDuration: ride.duration,
            type: ride.type,
            requestedAt: ride.requestedAt,
        },
    });

    return {
        ride: {
            id: ride.id,
            status: ride.status,
            pickup: {
                lat: ride.pickupLat,
                lng: ride.pickupLng,
                address: ride.pickupAddress,
            },
            dropoff: {
                lat: ride.dropoffLat,
                lng: ride.dropoffLng,
                address: ride.dropoffAddress,
            },
            systemFare: ride.systemFare,
            distance: ride.distance,
            estimatedDuration: ride.duration,
            type: ride.type,
            requestedAt: ride.requestedAt,
        },
    };
}
