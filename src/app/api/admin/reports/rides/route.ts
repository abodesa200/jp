import { handleApiError } from "@/server/core/http/error-handler";
import {  verifyToken } from "@/server/lib/auth/auth";
import {
    getAdminRidesReportService,
    rideHistoryQuerySchema,
} from "@/server/modules/rides/history";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/reports/rides - Admin rides report
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
 

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

        const result = await getAdminRidesReportService(query);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
