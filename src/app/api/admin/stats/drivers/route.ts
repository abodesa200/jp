import { handleApiError } from "@/core/http/error-handler";
import { forbidden, unauthorized, verifyToken } from "@/services/auth/auth";
import { getDriverStatisticsService } from "@/services/statistics/statistics.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/stats/drivers - Get driver statistics
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    try {
        const result = await getDriverStatisticsService();

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
