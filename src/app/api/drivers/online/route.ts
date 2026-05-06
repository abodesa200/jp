import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { getOnlineDriversService } from "@/services/driver/driver-status.service";
import { nearbyDriversQuerySchema } from "@/services/driver/driver.schema";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/drivers/online - Get online drivers
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const { searchParams } = new URL(req.url);

        // Optional location filtering
        const lat = searchParams.get("lat");
        const lng = searchParams.get("lng");

        let query = undefined;
        if (lat && lng) {
            query = nearbyDriversQuerySchema.parse({
                lat,
                lng,
                radius: searchParams.get("radius") || undefined,
                limit: searchParams.get("limit") || undefined,
            });
        }

        const result = await getOnlineDriversService(query);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
