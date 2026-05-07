import { handleApiError } from "@/server/core/http/error-handler";
import {
    getDriverStatsSchema,
    getDriverStatsService,
} from "@/server/modules/drivers";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/drivers/:id/stats
// Get driver statistics
// ─────────────────────────────────────────────

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const driverId = parseInt(id);

        if (isNaN(driverId)) {
            return NextResponse.json(
                { error: "Invalid driver ID" },
                { status: 400 }
            );
        }

        const validated = getDriverStatsSchema.parse({ driverId });
        const stats = await getDriverStatsService(validated);

        return NextResponse.json(stats);
    } catch (error) {
        return handleApiError(error);
    }
}
