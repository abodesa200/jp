
import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    createPromoCodeSchema,
    createPromoCodeService,
    getPromoCodesQuerySchema,
    getPromoCodesService,
} from "@/server/modules/admin";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/promo-codes
// Get all promo codes
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const { searchParams } = new URL(req.url);
        const query = getPromoCodesQuerySchema.parse({
            isActive: searchParams.get("isActive") || "all",
            page: searchParams.get("page") || "1",
            limit: searchParams.get("limit") || "20",
            search: searchParams.get("search") || undefined,
        });

        const result = await getPromoCodesService(payload, query);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// POST /api/admin/promo-codes
// Create promo code
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const body = await req.json();
        const data = createPromoCodeSchema.parse(body);

        const result = await createPromoCodeService(payload, data);

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}

