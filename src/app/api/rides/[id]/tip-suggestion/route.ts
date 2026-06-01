import { handleApiError } from "@/server/core/http/error-handler";
import { BadRequestError, ForbiddenError, NotFoundError } from "@/server/core/http/http-errors";
import { verifyToken } from "@/server/lib/auth/auth";
import { findRideWithDetails } from "@/server/modules/rides/rides.repository";
import { fetchTipSuggestion } from "@/server/modules/rides/rides.utils";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/rides/:id/tip-suggestion
// العميل أو راكب الرحلة التشاركية يطلب اقتراح tip بعد اكتمال الرحلة
// ─────────────────────────────────────────────

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);
        const { id } = await params;

        const ride = await findRideWithDetails(Number(id));

        if (!ride) throw new NotFoundError("Ride not found");

        const isOwner = ride.clientId === payload.userId;
        const passenger = ride.passengers?.find(
            (entry) => entry.clientId === payload.userId,
        );
        const isPassenger = Boolean(passenger);

        if (!isOwner && !isPassenger) {
            throw new ForbiddenError("You are not part of this ride");
        }

        if (isOwner && ride.tipSubmittedAt) {
            throw new BadRequestError("Tip has already been submitted");
        }

        if (isPassenger && passenger!.tipSubmittedAt) {
            throw new BadRequestError("Tip has already been submitted");
        }

        if (ride.status !== "COMPLETED") {
            throw new BadRequestError("Tip suggestion is only available for completed rides");
        }

        if (!ride.distance || !ride.startedAt) {
            throw new BadRequestError("Ride data is incomplete");
        }

        const baseTip = await fetchTipSuggestion({
            pickupLat: ride.pickupLat,
            pickupLng: ride.pickupLng,
            dropoffLat: ride.dropoffLat,
            dropoffLng: ride.dropoffLng,
            distance: ride.distance,
            startedAt: ride.startedAt,
        });

        const suggestedTips = [
            parseFloat((baseTip * 0.5).toFixed(2)),
            parseFloat(baseTip.toFixed(2)),
            parseFloat((baseTip * 2).toFixed(2)),
        ].filter((v) => v > 0);

        const personalFare = isPassenger
            ? Number(passenger!.fare ?? 0)
            : Number(ride.finalFare ?? ride.systemFare ?? 0);

        return Response.json({
            success: true,
            data: {
                suggestedTip: baseTip,
                suggestedTips,
                finalFare: personalFare,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
