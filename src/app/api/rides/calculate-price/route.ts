import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { calculateRidePriceSchema } from "@/server/modules/rides/rides.schema";
import {
    calculateDistance,
    calculateEstimatedDuration,
    fetchFareFromModel,
} from "@/server/modules/rides/rides.utils";
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

        const { pickupLat, pickupLng, dropoffLat, dropoffLng, serviceType, rideMode } = data;

        const distance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
        const systemFare = await fetchFareFromModel({
            pickupLat,
            pickupLng,
            dropoffLat,
            dropoffLng,
            distance,
            serviceType,
            rideMode,
        });
        const estimatedDuration = calculateEstimatedDuration(distance);

        return Response.json({
            success: true,
            data: {
                distance: parseFloat(distance.toFixed(4)),
                systemFare,
                estimatedDuration,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
