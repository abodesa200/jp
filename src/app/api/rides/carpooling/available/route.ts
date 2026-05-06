import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { availableCarpoolingQuerySchema } from "@/services/carpooling/carpooling.schema";
import { getAvailableCarpoolingService } from "@/services/carpooling/carpooling.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/rides/carpooling/available - Get available carpooling rides
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const { searchParams } = new URL(req.url);
        const query = availableCarpoolingQuerySchema.parse({
            pickupLat: searchParams.get("pickupLat"),
            pickupLng: searchParams.get("pickupLng"),
            dropoffLat: searchParams.get("dropoffLat"),
            dropoffLng: searchParams.get("dropoffLng"),
            radius: searchParams.get("radius") || undefined,
            limit: searchParams.get("limit") || undefined,
        });

        const result = await getAvailableCarpoolingService(payload, query);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
