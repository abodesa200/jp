import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    getMyPaymentsService,
    getPaymentsQuerySchema,
} from "@/server/modules/rides/payment";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/payments - Get my payments
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);
        const { searchParams } = new URL(req.url);
        const query = getPaymentsQuerySchema.parse({
            status: searchParams.get("status") || undefined,
            page: searchParams.get("page") || undefined,
            limit: searchParams.get("limit") || undefined,
        });

        const result = await getMyPaymentsService(payload, query);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
