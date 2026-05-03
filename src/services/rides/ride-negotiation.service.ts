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
        where: { id: parseInt(rideId) },
        include: {
            driver: {
                include: {
                    user: true,
                },
            },
            negotiation: true,
        },
    });

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    const isClient = ride.clientId === payload.userId;
    const isDriver = ride.driver?.userId === payload.userId;

    if (!isClient && !isDriver) {
        throw new ForbiddenError("You don't have permission to negotiate this ride");
    }

    if (ride.status !== "REQUESTED") {
        throw new BadRequestError("Can only negotiate on requested rides");
    }

    const offeredBy = isClient ? "CLIENT" : "DRIVER";

    // إذا في تفاوض موجود
    if (ride.negotiation) {
        if (ride.negotiation.expiresAt < new Date()) {
            await prisma.negotiation.update({
                where: { id: ride.negotiation.id },
                data: { status: "EXPIRED" },
            });
            throw new BadRequestError("Negotiation has expired");
        }

        if (
            ride.negotiation.status === "ACCEPTED" ||
            ride.negotiation.status === "REJECTED"
        ) {
            throw new BadRequestError(
                `Negotiation is already ${ride.negotiation.status.toLowerCase()}`
            );
        }

        // تحديث التفاوض
        const updateData: any = { status: "COUNTERED" };

        if (isClient) {
            updateData.clientOffer = amount;
        } else {
            updateData.driverCounter = amount;
        }

        const updatedNegotiation = await prisma.negotiation.update({
            where: { id: ride.negotiation.id },
            data: updateData,
        });

        await prisma.negotiationOffer.create({
            data: {
                negotiationId: updatedNegotiation.id,
                offeredBy,
                amount,
                message,
            },
        });

        const fullNegotiation = await prisma.negotiation.findUnique({
            where: { id: updatedNegotiation.id },
            include: {
                history: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        return { negotiation: fullNegotiation };
    }

    // إنشاء تفاوض جديد
    if (!isClient) {
        throw new ForbiddenError("Only clients can start negotiation");
    }

    const negotiation = await prisma.negotiation.create({
        data: {
            rideId: ride.id,
            systemFare: ride.systemFare!,
            clientOffer: amount,
            status: "PENDING",
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 دقائق
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
        where: { id: parseInt(rideId) },
        include: {
            driver: {
                include: {
                    user: true,
                },
            },
            negotiation: true,
        },
    });

    if (!ride || !ride.negotiation) {
        throw new NotFoundError("Ride or negotiation not found");
    }

    const isClient = ride.clientId === payload.userId;
    const isDriver = ride.driver?.userId === payload.userId;

    if (!isClient && !isDriver) {
        throw new ForbiddenError(
            "You don't have permission to respond to this negotiation"
        );
    }

    if (ride.negotiation.expiresAt < new Date()) {
        await prisma.negotiation.update({
            where: { id: ride.negotiation.id },
            data: { status: "EXPIRED" },
        });
        throw new BadRequestError("Negotiation has expired");
    }

    if (action === "accept") {
        let agreedFare: number;
        if (isClient && ride.negotiation.driverCounter) {
            agreedFare = ride.negotiation.driverCounter;
        } else if (isDriver && ride.negotiation.clientOffer) {
            agreedFare = ride.negotiation.clientOffer;
        } else {
            throw new BadRequestError("No offer to accept");
        }

        const updatedNegotiation = await prisma.negotiation.update({
            where: { id: ride.negotiation.id },
            data: {
                status: "ACCEPTED",
                agreedFare,
            },
            include: {
                history: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        await prisma.ride.update({
            where: { id: parseInt(rideId) },
            data: { fare: agreedFare },
        });

        return { negotiation: updatedNegotiation };
    } else {
        const updatedNegotiation = await prisma.negotiation.update({
            where: { id: ride.negotiation.id },
            data: { status: "REJECTED" },
            include: {
                history: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        return { negotiation: updatedNegotiation };
    }
}
