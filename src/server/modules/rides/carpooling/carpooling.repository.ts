import { prisma } from "@/lib/prisma";
import { JoinCarpoolingDTO } from "./carpooling.schema";

// ─────────────────────────────────────────────
// Find Ride with Passengers
// ─────────────────────────────────────────────

export async function findRideWithPassengers(rideId: number) {
    return prisma.ride.findUnique({
        where: { id: rideId },
        include: {
            passengers: true,
        },
    });
}

// ─────────────────────────────────────────────
// Find Passenger
// ─────────────────────────────────────────────

export async function findPassenger(rideId: number, clientId: number) {
    return prisma.ridePassenger.findFirst({
        where: {
            rideId,
            clientId,
        },
    });
}

// ─────────────────────────────────────────────
// Add Passenger (Transaction)
// ─────────────────────────────────────────────

export async function addPassenger(
    rideId: number,
    clientId: number,
    data: JoinCarpoolingDTO & { fare: number }
) {
    return prisma.$transaction(async (tx) => {
        const passenger = await tx.ridePassenger.create({
            data: {
                rideId,
                clientId,
                pickupLat: data.pickupLat,
                pickupLng: data.pickupLng,
                pickupAddress: data.pickupAddress,
                dropoffLat: data.dropoffLat,
                dropoffLng: data.dropoffLng,
                dropoffAddress: data.dropoffAddress,
                fare: data.fare,
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
}

// ─────────────────────────────────────────────
// Remove Passenger (Transaction)
// ─────────────────────────────────────────────

export async function removePassenger(rideId: number, clientId: number) {
    return prisma.$transaction(async (tx) => {
        await tx.ridePassenger.delete({
            where: {
                rideId_clientId: {
                    rideId,
                    clientId,
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
}

// ─────────────────────────────────────────────
// Get Ride Passengers
// ─────────────────────────────────────────────

export async function getRidePassengers(rideId: number) {
    return prisma.ridePassenger.findMany({
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
}

// ─────────────────────────────────────────────
// Get Available Carpooling Rides
// ─────────────────────────────────────────────

export async function getAvailableCarpoolingRides(userId: number) {
    return prisma.ride.findMany({
        where: {
            type: "CARPOOLING",
            status: {
                in: ["REQUESTED", "ACCEPTED"],
            },
            availableSeats: {
                gt: 0,
            },
            clientId: {
                not: userId, // Exclude user's own rides
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
}

// ─────────────────────────────────────────────
// Find Ride Basic Info
// ─────────────────────────────────────────────

export async function findRideBasicInfo(rideId: number) {
    return prisma.ride.findUnique({
        where: { id: rideId },
        select: {
            id: true,
            clientId: true,
            driverId: true,
            type: true,
        },
    });
}
