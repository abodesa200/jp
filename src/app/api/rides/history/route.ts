import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { getRideHistoryService, rideHistoryQuerySchema } from "@/services/rides/ride-history.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/rides/history - Get ride history
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const { searchParams } = new URL(req.url);
        const query = rideHistoryQuerySchema.parse({
            status: searchParams.get("status") || undefined,
            type: searchParams.get("type") || undefined,
            startDate: searchParams.get("startDate") || undefined,
            endDate: searchParams.get("endDate") || undefined,
            page: searchParams.get("page") || undefined,
            limit: searchParams.get("limit") || undefined,
        });

        const result = await getRideHistoryService(payload, query);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
