import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import { NegotiateRideDTO, RespondToNegotiationDTO } from "./ride.schema";

type Payload = {
    userId: number;
    role: string;
};

/**
 * Start or continue negotiation on a ride
 * Client can start negotiation, both parties can counter-offer
 */
export async function negotiateRideService(
    payload: Payload,
    rideId: string,
    data: NegotiateRideDTO
) {
    const { amount, message } = data;

    const ride = await prisma.ride.findUnique({
        where: { id: Number(rideId) },
        include: {
            negotiation: true,
        },
    });

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    // 🔥 IMPORTANT RULE: negotiation only in REQUESTED
    if (ride.status !== "REQUESTED") {
        throw new BadRequestError(
            "Negotiation is only allowed before ride is accepted"
        );
    }

    const isClient = ride.clientId === payload.userId;
    const isDriver = payload.role === "DRIVER";

    if (!isClient && !isDriver) {
        throw new ForbiddenError("You can't negotiate this ride");
    }

    const offeredBy = isClient ? "CLIENT" : "DRIVER";

    // =========================
    // EXISTING NEGOTIATION
    // =========================
    if (ride.negotiation) {
        if (ride.negotiation.expiresAt < new Date()) {
            await prisma.negotiation.update({
                where: { id: ride.negotiation.id },
                data: { status: "EXPIRED" },
            });

            throw new BadRequestError("Negotiation expired");
        }

        if (
            ride.negotiation.status === "ACCEPTED" ||
            ride.negotiation.status === "REJECTED"
        ) {
            throw new BadRequestError("Negotiation already finished");
        }

        const updateData: any = { status: "COUNTERED" };

        if (isClient) {
            updateData.clientOffer = amount;
        } else {
            updateData.driverCounter = amount;
        }

        const updated = await prisma.negotiation.update({
            where: { id: ride.negotiation.id },
            data: updateData,
        });

        await prisma.negotiationOffer.create({
            data: {
                negotiationId: updated.id,
                offeredBy,
                amount,
                message,
            },
        });

        const full = await prisma.negotiation.findUnique({
            where: { id: updated.id },
            include: {
                history: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        return { negotiation: full };
    }

    // =========================
    // CREATE NEW NEGOTIATION
    // =========================
    if (!isClient) {
        throw new ForbiddenError("Only client can start negotiation");
    }

    const negotiation = await prisma.negotiation.create({
        data: {
            rideId: ride.id,
            systemFare: ride.systemFare!,
            clientOffer: amount,
            status: "PENDING",
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            history: {
                create: {
                    offeredBy: "CLIENT",
                    amount,
                    message,
                },
            },
        },
        include: {
            history: true,
        },
    });

    return { negotiation };
}
/**
 * Accept or reject a negotiation offer
 * Updates ride fare if accepted
 */
export async function respondToNegotiationService(
    payload: Payload,
    rideId: string,
    data: RespondToNegotiationDTO
) {
    const { action } = data;

    const ride = await prisma.ride.findUnique({
        where: { id: Number(rideId) },
        include: {
            negotiation: true,
        },
    });

    if (!ride || !ride.negotiation) {
        throw new NotFoundError("Negotiation not found");
    }

    if (ride.status !== "REQUESTED") {
        throw new BadRequestError("Ride already accepted, negotiation locked");
    }

    const isClient = ride.clientId === payload.userId;
    const isDriver = payload.role === "DRIVER";

    if (!isClient && !isDriver) {
        throw new ForbiddenError("No permission");
    }

    if (ride.negotiation.expiresAt < new Date()) {
        await prisma.negotiation.update({
            where: { id: ride.negotiation.id },
            data: { status: "EXPIRED" },
        });

        throw new BadRequestError("Negotiation expired");
    }

    // =========================
    // ACCEPT
    // =========================
    if (action === "accept") {
        let agreedFare: number;

        if (isClient && ride.negotiation.driverCounter) {
            agreedFare = ride.negotiation.driverCounter;
        } else if (isDriver && ride.negotiation.clientOffer) {
            agreedFare = ride.negotiation.clientOffer;
        } else {
            throw new BadRequestError("No valid offer");
        }

        const updated = await prisma.negotiation.update({
            where: { id: ride.negotiation.id },
            data: {
                status: "ACCEPTED",
                agreedFare,
            },
        });

        // optional: update ride fare BEFORE acceptance
        await prisma.ride.update({
            where: { id: Number(rideId) },
            data: {
                systemFare: agreedFare,
            },
        });

        return { negotiation: updated };
    }

    // =========================
    // REJECT
    // =========================
    const updated = await prisma.negotiation.update({
        where: { id: ride.negotiation.id },
        data: {
            status: "REJECTED",
        },
    });

    return { negotiation: updated };
}
