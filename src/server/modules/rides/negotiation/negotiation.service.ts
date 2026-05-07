import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import * as negotiationRepository from "./negotiation.repository";
import { NegotiateRideDTO, RespondToNegotiationDTO } from "./negotiation.schema";

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

    const ride = await negotiationRepository.findRideWithNegotiation(Number(rideId));

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
            await negotiationRepository.updateNegotiation(ride.negotiation.id, {
                status: "EXPIRED",
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

        const updated = await negotiationRepository.updateNegotiation(
            ride.negotiation.id,
            updateData
        );

        await negotiationRepository.addNegotiationOffer({
            negotiationId: updated.id,
            offeredBy,
            amount,
            message,
        });

        const full = await negotiationRepository.getNegotiationWithHistory(updated.id);

        return { negotiation: full };
    }

    // =========================
    // CREATE NEW NEGOTIATION
    // =========================
    if (!isClient) {
        throw new ForbiddenError("Only client can start negotiation");
    }

    const negotiation = await negotiationRepository.createNegotiation({
        rideId: ride.id,
        systemFare: ride.systemFare!,
        clientOffer: amount,
        message,
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

    const ride = await negotiationRepository.findRideWithNegotiation(Number(rideId));

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
        await negotiationRepository.updateNegotiation(ride.negotiation.id, {
            status: "EXPIRED",
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

        const updated = await negotiationRepository.updateNegotiation(
            ride.negotiation.id,
            {
                status: "ACCEPTED",
                agreedFare,
            }
        );

        // optional: update ride fare BEFORE acceptance
        await negotiationRepository.updateRideFare(Number(rideId), agreedFare);

        return { negotiation: updated };
    }

    // =========================
    // REJECT
    // =========================
    const updated = await negotiationRepository.updateNegotiation(
        ride.negotiation.id,
        {
            status: "REJECTED",
        }
    );

    return { negotiation: updated };
}
