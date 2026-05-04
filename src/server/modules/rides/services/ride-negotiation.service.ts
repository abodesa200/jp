/**
 * Ride Negotiation Service
 * Handles fare negotiation between clients and drivers
 */

import { BadRequestError, ForbiddenError, NotFoundError } from "../../../core/errors";
import { prisma } from "../../../db/prisma";
import { NegotiateRideInput, RespondToNegotiationInput } from "../ride.types";

export async function negotiateRide(
    rideId: number,
    userId: number,
    role: string,
    data: NegotiateRideInput
) {
    const { amount, message } = data;

    const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: { negotiation: true },
    });

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    if (ride.status !== "REQUESTED") {
        throw new BadRequestError("Negotiation only allowed before ride is accepted");
    }

    const isClient = ride.clientId === userId;
    const isDriver = role === "DRIVER";

    if (!isClient && !isDriver) {
        throw new ForbiddenError("Cannot negotiate this ride");
    }

    const offeredBy = isClient ? "CLIENT" : "DRIVER";

    // Existing negotiation
    if (ride.negotiation) {
        if (ride.negotiation.expiresAt < new Date()) {
            await prisma.negotiation.update({
                where: { id: ride.negotiation.id },
                data: { status: "EXPIRED" },
            });
            throw new BadRequestError("Negotiation expired");
        }

        if (["ACCEPTED", "REJECTED"].includes(ride.negotiation.status)) {
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
            include: { history: { orderBy: { createdAt: "asc" } } },
        });

        return { negotiation: full };
    }

    // New negotiation
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
                create: { offeredBy: "CLIENT", amount, message },
            },
        },
        include: { history: true },
    });

    return { negotiation };
}

export async function respondToNegotiation(
    rideId: number,
    userId: number,
    role: string,
    data: RespondToNegotiationInput
) {
    const { action } = data;

    const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: { negotiation: true },
    });

    if (!ride || !ride.negotiation) {
        throw new NotFoundError("Negotiation not found");
    }

    if (ride.status !== "REQUESTED") {
        throw new BadRequestError("Ride already accepted, negotiation locked");
    }

    const isClient = ride.clientId === userId;
    const isDriver = role === "DRIVER";

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
            data: { status: "ACCEPTED", agreedFare },
        });

        await prisma.ride.update({
            where: { id: rideId },
            data: { systemFare: agreedFare },
        });

        return { negotiation: updated };
    }

    // Reject
    const updated = await prisma.negotiation.update({
        where: { id: ride.negotiation.id },
        data: { status: "REJECTED" },
    });

    return { negotiation: updated };
}
