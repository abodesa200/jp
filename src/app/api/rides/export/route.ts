import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { exportRideHistoryService, rideHistoryQuerySchema } from "@/services/rides/ride-history.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/rides/export - Export ride history as CSV
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
        });

        const csv = await exportRideHistoryService(payload, query);

        return new Response(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="rides-${Date.now()}.csv"`,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}
