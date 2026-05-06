import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { getNearbyDriversService } from "@/services/driver/driver-status.service";
import { nearbyDriversQuerySchema } from "@/services/driver/driver.schema";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/drivers/nearby - Get nearby drivers
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const { searchParams } = new URL(req.url);
        const query = nearbyDriversQuerySchema.parse({
            lat: searchParams.get("lat"),
            lng: searchParams.get("lng"),
            radius: searchParams.get("radius") || undefined,
            limit: searchParams.get("limit") || undefined,
        });

        const result = await getNearbyDriversService(query);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
