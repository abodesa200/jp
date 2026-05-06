import { handleApiError } from "@/core/http/error-handler";
import { forbidden, unauthorized, verifyToken } from "@/services/auth/auth";
import { getPaymentsQuerySchema } from "@/services/payment/payment.schema";
import { getAllPaymentsService } from "@/services/payment/payment.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/payments - Get all payments (Admin)
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    try {
        const { searchParams } = new URL(req.url);
        const query = getPaymentsQuerySchema.parse({
            status: searchParams.get("status") || undefined,
            page: searchParams.get("page") || undefined,
            limit: searchParams.get("limit") || undefined,
        });

        const result = await getAllPaymentsService(query);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
