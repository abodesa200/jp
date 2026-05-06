import { handleApiError } from "@/core/http/error-handler";
import { forbidden, unauthorized, verifyToken } from "@/services/auth/auth";
import { createPromoSchema, getPromoCodesQuerySchema } from "@/services/promo/promo.schema";
import { createPromoCodeService, getPromoCodesService } from "@/services/promo/promo.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/promo-codes - Get all promo codes
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    try {
        const { searchParams } = new URL(req.url);
        const query = getPromoCodesQuerySchema.parse({
            isActive: searchParams.get("isActive") || undefined,
            page: searchParams.get("page") || undefined,
            limit: searchParams.get("limit") || undefined,
        });

        const result = await getPromoCodesService(query);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// POST /api/admin/promo-codes - Create promo code
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    try {
        const body = await req.json();
        const data = createPromoSchema.parse(body);

        const result = await createPromoCodeService(data);

        return Response.json({
            success: true,
            data: result,
        }, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
