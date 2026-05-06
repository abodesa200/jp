import { ConflictError, ForbiddenError, NotFoundError } from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import { emitSocketEvent } from "@/lib/socket/emit";
import { calculateDistance } from "../driver/driver.utils";
import { calculateFare } from "../rides/ride.utils";
import { AvailableCarpoolingQueryDTO, JoinCarpoolingDTO } from "./carpooling.schema";

type Payload = {
    userId: number;
    role: string;
};

// ─────────────────────────────────────────────
// Join Carpooling Ride
// ─────────────────────────────────────────────

export async function joinCarpoolingService(
    payload: Payload,
    rideId: number,
    data: JoinCarpoolingDTO
) {
    if (payload.role !== "CLIENT") {
        throw new ForbiddenError("Only clients can join carpooling rides");
    }

    // Get ride details
    const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: {
            passengers: true,
        },
    });

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    // Validate ride is carpooling type
    if (ride.type !== "CARPOOLING") {
        throw new ForbiddenError("Can only join carpooling rides");
    }

    // Validate ride status
    if (!["REQUESTED", "ACCEPTED"].includes(ride.status)) {
        throw new ForbiddenError("Cannot join ride that is in progress or completed");
    }

    // Check if user is already a passenger
    const existingPassenger = ride.passengers.find((p) => p.clientId === payload.userId);
    if (existingPassenger) {
        throw new ConflictError("You are already a passenger on this ride");
    }

    // Check if user is the ride owner
    if (ride.clientId === payload.userId) {
        throw new ConflictError("You cannot join your own ride");
    }

    // Check available seats
    if (ride.availableSeats <= 0) {
        throw new ForbiddenError("No available seats on this ride");
    }

    // Calculate fare for this passenger
    const distance = calculateDistance(
        data.pickupLat,
        data.pickupLng,
        data.dropoffLat,
        data.dropoffLng
    );
    const fare = calculateFare(distance);

    // Add passenger and decrement available seats in a transaction
    const result = await prisma.$transaction(async (tx) => {
        const passenger = await tx.ridePassenger.create({
            data: {
                rideId,
                clientId: payload.userId,
                pickupLat: data.pickupLat,
                pickupLng: data.pickupLng,
                pickupAddress: data.pickupAddress,
                dropoffLat: data.dropoffLat,
                dropoffLng: data.dropoffLng,
                dropoffAddress: data.dropoffAddress,
                fare,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        await tx.ride.update({
            where: { id: rideId },
            data: {
                availableSeats: {
                    decrement: 1,
                },
            },
        });

        return passenger;
    });

    // Notify driver and other passengers
    emitSocketEvent(`ride:${rideId}`, "passenger:joined", {
        passenger: result,
        availableSeats: ride.availableSeats - 1,
    });

    return result;
}

// ─────────────────────────────────────────────
// Leave Carpooling Ride
// ─────────────────────────────────────────────

export async function leaveCarpoolingService(payload: Payload, rideId: number) {
    if (payload.role !== "CLIENT") {
        throw new ForbiddenError("Only clients can leave carpooling rides");
    }

    // Get ride details
    const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: {
            passengers: {
                where: {
                    clientId: payload.userId,
                },
            },
        },
    });

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    // Check if user is a passenger
    if (ride.passengers.length === 0) {
        throw new NotFoundError("You are not a passenger on this ride");
    }

    // Validate ride hasn't started
    if (["IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(ride.status)) {
        throw new ForbiddenError("Cannot leave ride that has started or completed");
    }

    // Remove passenger and increment available seats in a transaction
    await prisma.$transaction(async (tx) => {
        await tx.ridePassenger.delete({
            where: {
                rideId_clientId: {
                    rideId,
                    clientId: payload.userId,
                },
            },
        });

        await tx.ride.update({
            where: { id: rideId },
            data: {
                availableSeats: {
                    increment: 1,
                },
            },
        });
    });

    // Notify driver and other passengers
    emitSocketEvent(`ride:${rideId}`, "passenger:left", {
        clientId: payload.userId,
        availableSeats: ride.availableSeats + 1,
    });

    return {
        success: true,
        message: "Successfully left the ride",
    };
}

// ─────────────────────────────────────────────
// Get Ride Passengers
// ─────────────────────────────────────────────

export async function getRidePassengersService(payload: Payload, rideId: number) {
    // Get ride details
    const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        select: {
            id: true,
            clientId: true,
            driverId: true,
            type: true,
        },
    });

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    // Validate ride is carpooling
    if (ride.type !== "CARPOOLING") {
        throw new ForbiddenError("This is not a carpooling ride");
    }

    // User must be client, driver, or a passenger
    const isPassenger = await prisma.ridePassenger.findFirst({
        where: {
            rideId,
            clientId: payload.userId,
        },
    });

    if (
        payload.role !== "ADMIN" &&
        ride.clientId !== payload.userId &&
        ride.driverId !== payload.userId &&
        !isPassenger
    ) {
        throw new ForbiddenError("You can only view passengers for your own rides");
    }

    const passengers = await prisma.ridePassenger.findMany({
        where: { rideId },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    avatarUrl: true,
                },
            },
        },
        orderBy: { joinedAt: "asc" },
    });

    return {
        passengers,
        total: passengers.length,
    };
}

// ─────────────────────────────────────────────
// Get Available Carpooling Rides
// ─────────────────────────────────────────────

export async function getAvailableCarpoolingService(
    payload: Payload,
    query: AvailableCarpoolingQueryDTO
) {
    if (payload.role !== "CLIENT") {
        throw new ForbiddenError("Only clients can search for carpooling rides");
    }

    const { pickupLat, pickupLng, dropoffLat, dropoffLng, radius, limit } = query;

    // Get all available carpooling rides
    const rides = await prisma.ride.findMany({
        where: {
            type: "CARPOOLING",
            status: {
                in: ["REQUESTED", "ACCEPTED"],
            },
            availableSeats: {
                gt: 0,
            },
            clientId: {
                not: payload.userId, // Exclude user's own rides
            },
        },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                },
            },
            driver: {
                select: {
                    id: true,
                    userId: true,
                    carModel: true,
                    carColor: true,
                    rating: true,
                    user: {
                        select: {
                            name: true,
                            avatarUrl: true,
                        },
                    },
                },
            },
            passengers: {
                select: {
                    id: true,
                },
            },
        },
        orderBy: { requestedAt: "desc" },
    });

    // Filter by proximity to pickup and dropoff locations
    const nearbyRides = rides
        .map((ride) => {
            const pickupDistance = calculateDistance(
                pickupLat,
                pickupLng,
                ride.pickupLat,
                ride.pickupLng
            );
            const dropoffDistance = calculateDistance(
                dropoffLat,
                dropoffLng,
                ride.dropoffLat,
                ride.dropoffLng
            );

            return {
                ...ride,
                pickupDistance,
                dropoffDistance,
                totalDistance: pickupDistance + dropoffDistance,
            };
        })
        .filter((ride) => ride.pickupDistance <= radius && ride.dropoffDistance <= radius)
        .sort((a, b) => a.totalDistance - b.totalDistance)
        .slice(0, limit);

    return {
        rides: nearbyRides,
        total: nearbyRides.length,
    };
}
