import { prisma } from "@/lib/prisma";
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { emitRideCreatedToMatchingDrivers } from "@/server/lib/socket/driver-rooms";
import { emitSocketEvent } from "@/server/lib/socket/emit";
import { CreateRideDTO } from "./create-ride.schema";

type JWTPayload = {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
};

// ─────────────────────────────────────────────
// Helper: Calculate Distance
// ─────────────────────────────────────────────

function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ─────────────────────────────────────────────
// Helper: Calculate Fare
// ─────────────────────────────────────────────

function calculateFare(distanceKm: number): number {
    const baseFare = 5; // Base fare in SAR
    const perKm = 2; // Price per km in SAR
    const minFare = 5; // Minimum fare in SAR
    const fare = baseFare + distanceKm * perKm;
    return Math.max(fare, minFare);
}

// ─────────────────────────────────────────────
// Create Ride (Admin)
// ─────────────────────────────────────────────

export async function createRideService(
    payload: JWTPayload,
    data: CreateRideDTO
) {
    if (payload.role !== "ADMIN") {
        throw new ForbiddenError("Admin access required");
    }

    // Verify client exists
    const client = await prisma.user.findUnique({
        where: { id: data.clientId },
    });

    if (!client) {
        throw new NotFoundError("Client not found");
    }

    // Verify driver if provided
    let driver = null;
    if (data.driverId) {
        driver = await prisma.driver.findUnique({
            where: { id: data.driverId },
            include: {
                user: true,
            },
        });

        if (!driver) {
            throw new NotFoundError("Driver not found");
        }

        if (!driver.isApproved) {
            throw new BadRequestError("Driver is not approved");
        }
    }

    // Calculate distance and fare
    const distance = calculateDistance(
        data.pickupLat,
        data.pickupLng,
        data.dropoffLat,
        data.dropoffLng
    );

    const systemFare = calculateFare(distance);
    const estimatedDuration = Math.ceil((distance / 40) * 60); // Assuming 40 km/h average speed

    // Determine max passengers
    const maxPassengers =
        data.maxPassengers || (data.type === "CARPOOLING" ? 4 : 1);

    // Create ride
    const ride = await prisma.ride.create({
        data: {
            clientId: data.clientId,
            driverId: data.driverId || null,
            pickupLat: data.pickupLat,
            pickupLng: data.pickupLng,
            pickupAddress: data.pickupAddress,
            dropoffLat: data.dropoffLat,
            dropoffLng: data.dropoffLng,
            dropoffAddress: data.dropoffAddress,
            type: data.type || "STANDARD",
            maxPassengers,
            availableSeats: maxPassengers,
            systemFare,
            fare: systemFare,
            distance,
            duration: estimatedDuration,
            status: data.driverId ? "ACCEPTED" : "REQUESTED",
            ...(data.driverId && { acceptedAt: new Date() }),
        },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    email: true,
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
                            email: true,
                            phone: true,
                            avatarUrl: true,
                        },
                    },
                },
            },
        },
    });

    // Send notifications
    if (data.driverId && driver) {
        // Notify driver
        await emitSocketEvent(`user:${driver.userId}`, "ride:assigned", {
            ride,
        });

        // Notify client
        await emitSocketEvent(`user:${data.clientId}`, "ride:accepted", {
            ride,
        });

        // Notify ride room
        await emitSocketEvent(`ride:${ride.id}`, "ride:accepted", { ride });
    } else {
        await emitRideCreatedToMatchingDrivers(ride, { ride });

        await emitSocketEvent(`user:${data.clientId}`, "ride:created", {
            ride,
        });
    }

    return {
        ride,
        message: "Ride created successfully",
    };
}
