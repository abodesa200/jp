import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// Find Ride with Negotiation
// ─────────────────────────────────────────────

export async function findRideWithNegotiation(rideId: number) {
    return prisma.ride.findUnique({
        where: { id: rideId },
        include: {
            negotiation: true,
        },
    });
}

// ─────────────────────────────────────────────
// Create Negotiation
// ─────────────────────────────────────────────

export async function createNegotiation(data: {
    rideId: number;
    systemFare: number;
    clientOffer: number;
    message?: string;
}) {
    return prisma.negotiation.create({
        data: {
            rideId: data.rideId,
            systemFare: data.systemFare,
            clientOffer: data.clientOffer,
            status: "PENDING",
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            history: {
                create: {
                    offeredBy: "CLIENT",
                    amount: data.clientOffer,
                    message: data.message,
                },
            },
        },
        include: {
            history: true,
        },
    });
}

// ─────────────────────────────────────────────
// Update Negotiation
// ─────────────────────────────────────────────

export async function updateNegotiation(negotiationId: number, data: any) {
    return prisma.negotiation.update({
        where: { id: negotiationId },
        data,
    });
}

// ─────────────────────────────────────────────
// Add Negotiation Offer
// ─────────────────────────────────────────────

export async function addNegotiationOffer(data: {
    negotiationId: number;
    offeredBy: "CLIENT" | "DRIVER";
    amount: number;
    message?: string;
}) {
    return prisma.negotiationOffer.create({
        data,
    });
}

// ─────────────────────────────────────────────
// Get Negotiation with History
// ─────────────────────────────────────────────

export async function getNegotiationWithHistory(negotiationId: number) {
    return prisma.negotiation.findUnique({
        where: { id: negotiationId },
        include: {
            history: {
                orderBy: { createdAt: "asc" },
            },
        },
    });
}

// ─────────────────────────────────────────────
// Update Ride Fare
// ─────────────────────────────────────────────

export async function updateRideFare(rideId: number, fare: number) {
    return prisma.ride.update({
        where: { id: rideId },
        data: {
            systemFare: fare,
        },
    });
}
