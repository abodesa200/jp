import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { getReviewsQuerySchema } from "@/services/review/review.schema";
import { getDriverReviewsService } from "@/services/review/review.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/drivers/[id]/reviews - Get driver reviews
// ─────────────────────────────────────────────

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const { id } = await params;
        const driverId = parseInt(id);

        if (isNaN(driverId)) {
            return Response.json(
                { success: false, error: "Invalid driver ID" },
                { status: 400 }
            );
        }

        const { searchParams } = new URL(req.url);
        const query = getReviewsQuerySchema.parse({
            page: searchParams.get("page") || undefined,
            limit: searchParams.get("limit") || undefined,
        });

        const result = await getDriverReviewsService(driverId, query);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
