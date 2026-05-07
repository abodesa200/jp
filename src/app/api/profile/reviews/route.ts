import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    
    getReviewsQuerySchema,
} from "@/server/modules/profile/reviews";
import { getMyReviewsService } from "@/server/modules/profile/reviews/reviews.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/profile/reviews - Get my reviews
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

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
