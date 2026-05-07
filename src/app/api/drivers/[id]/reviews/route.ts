import { handleApiError } from "@/server/core/http/error-handler";
import {
    getDriverReviewsSchema,
    getDriverReviewsService,
} from "@/server/modules/drivers";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/drivers/:id/reviews
// Get driver reviews
// Query params: page, limit
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

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        const validated = getDriverReviewsSchema.parse({
            driverId,
            page,
            limit,
        });

        const result = await getDriverReviewsService(validated);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
