import { handleApiError } from "@/core/http/error-handler";
import { forbidden, unauthorized, verifyToken } from "@/services/auth/auth";
import { statisticsQuerySchema } from "@/services/statistics/statistics.schema";
import { getUserStatisticsService } from "@/services/statistics/statistics.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/stats/users - Get user statistics
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    try {
        const { searchParams } = new URL(req.url);
        const query = statisticsQuerySchema.parse({
            period: searchParams.get("period") || undefined,
            startDate: searchParams.get("startDate") || undefined,
            endDate: searchParams.get("endDate") || undefined,
        });

        const result = await getUserStatisticsService(query);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
