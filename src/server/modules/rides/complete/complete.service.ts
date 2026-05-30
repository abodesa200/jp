import { prisma } from "@/lib/prisma";
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { emitSocketEvent } from "@/server/lib/socket/emit";
import { findRideWithDetails } from "../rides.repository";
import { fetchTipSuggestion, mapRide } from "../rides.utils";

type Payload = { userId: number; role: string };

// ─────────────────────────────────────────────
// Complete Ride + Tip Suggestions
// ─────────────────────────────────────────────

export async function completeRideService(payload: Payload, rideId: string) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can complete rides");
    }

    const ride = await findRideWithDetails(Number(rideId));

    if (!ride) throw new NotFoundError("Ride not found");

    if (ride.driver?.userId !== payload.userId) {
        throw new ForbiddenError("You are not the assigned driver");
    }

    if (ride.status !== "IN_PROGRESS") {
        throw new BadRequestError("Ride must be IN_PROGRESS to complete");
    }

    // ── mark ride as COMPLETED
    const completed = await prisma.ride.update({
        where: { id: ride.id },
        data: {
            status: "COMPLETED",
            completedAt: new Date(),
        },
    });

    // ── get tip suggestions from ML model
    let suggestedTips: number[] = [];

    if (ride.distance && ride.startedAt) {
        const baseTip = await fetchTipSuggestion({
            pickupLat: ride.pickupLat,
            pickupLng: ride.pickupLng,
            dropoffLat: ride.dropoffLat,
            dropoffLng: ride.dropoffLng,
            distance: ride.distance,
            startedAt: ride.startedAt,
        });

        // build 3 options: ~50%, ~100%, ~200% of suggested
        suggestedTips = [
            parseFloat((baseTip * 0.5).toFixed(2)),
            parseFloat(baseTip.toFixed(2)),
            parseFloat((baseTip * 2).toFixed(2)),
        ].filter((v) => v > 0);
    }

    const mapped = mapRide(completed);

    // notify both client and driver
    emitSocketEvent(`ride:${rideId}`, "ride:completed", {
        ride: mapped,
        suggestedTips,
    });

    return {
        ride: mapped,
        suggestedTips,
    };
}
