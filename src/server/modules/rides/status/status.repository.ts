import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// Find Ride by ID
// ─────────────────────────────────────────────

export async function findRideById(rideId: number) {
    return prisma.ride.findUnique({
        where: { id: rideId },
        include: {
            driver: {
                select: { userId: true },
            },
        },
    });
}

// ─────────────────────────────────────────────
// Update Ride Status
// ─────────────────────────────────────────────

export async function updateRideStatus(rideId: number, data: any) {
    return prisma.ride.update({
        where: { id: rideId },
        data,
    });
}

// ─────────────────────────────────────────────
// Accept Ride (Atomic)
// ─────────────────────────────────────────────

export async function acceptRide(rideId: number, driverId: number) {
    return prisma.ride.updateMany({
        where: {
            id: rideId,
            status: "REQUESTED",
            driverId: null,
        },
        data: {
            driverId,
            status: "ACCEPTED",
            acceptedAt: new Date(),
        },
    });
}

// ─────────────────────────────────────────────
// Find Driver by User ID
// ─────────────────────────────────────────────

export async function findDriverByUserId(userId: number) {
    return prisma.driver.findUnique({
        where: { userId },
    });
}
