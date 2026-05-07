
import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    getPaymentsQuerySchema,
    getPaymentsService,
} from "@/server/modules/admin";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/payments
// Get all payments (Admin)
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const { searchParams } = new URL(req.url);
        const query = getPaymentsQuerySchema.parse({
            status: searchParams.get("status") || "all",
            method: searchParams.get("method") || "all",
            page: searchParams.get("page") || "1",
            limit: searchParams.get("limit") || "20",
            startDate: searchParams.get("startDate") || undefined,
            endDate: searchParams.get("endDate") || undefined,
        });

        const result = await getPaymentsService(payload, query);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}

