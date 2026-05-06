import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { getPaymentsQuerySchema } from "@/services/payment/payment.schema";
import { getMyPaymentsService } from "@/services/payment/payment.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/payments - Get my payments
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
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
