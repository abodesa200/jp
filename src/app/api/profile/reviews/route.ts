import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { getReviewsQuerySchema } from "@/services/review/review.schema";
import { getMyReviewsService } from "@/services/review/review.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/profile/reviews - Get my reviews
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const { searchParams } = new URL(req.url);
        const query = getReviewsQuerySchema.parse({
            page: searchParams.get("page") || undefined,
            limit: searchParams.get("limit") || undefined,
        });

        const result = await getMyReviewsService(payload, query);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
