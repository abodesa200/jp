import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { calculateRidePriceSchema } from "@/server/modules/rides/rides.schema";
import {
    calculateDistance,
    fetchDurationFromModel,
    fetchFareFromModel,
} from "@/server/modules/rides/rides.utils";
import { calculateCarpoolShare } from "@/server/modules/rides/carpooling/carpooling.pricing";
import { NextRequest } from "next/server";

// POST /api/rides/calculate-price
export async function POST(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        if (payload.role !== "CLIENT") {
            return new Response(
                JSON.stringify({ success: false, error: "Only clients can calculate price" }),
                { status: 403 }
            );
        }

        const body = await req.json();
        const data = calculateRidePriceSchema.parse(body);

        const { pickupLat, pickupLng, dropoffLat, dropoffLng, serviceType, rideMode, maxPassengers } = data;

        const distance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);

        // run both models in parallel
        const [systemFare, estimatedDuration] = await Promise.all([
            fetchFareFromModel({ pickupLat, pickupLng, dropoffLat, dropoffLng, distance, serviceType, rideMode }),
            fetchDurationFromModel({ pickupLat, pickupLng, dropoffLat, dropoffLng, distance }),
        ]);

        const participantCount = rideMode === "CARPOOLING"
            ? Math.max(maxPassengers ?? 1, 1)
            : 1;
        const sharePerPerson = rideMode === "CARPOOLING"
            ? calculateCarpoolShare(systemFare, participantCount)
            : systemFare;

        console.log(`[fare] distance: ${distance} km, fare: $${systemFare}, duration: ${estimatedDuration} min`);
        return Response.json({
            success: true,
            data: {
                distance: parseFloat(distance.toFixed(4)),
                systemFare,
                sharePerPerson,
                participantCount,
                estimatedDuration,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
