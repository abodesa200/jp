import { handleApiError } from "@/server/core/http/http-errors";
import { authenticate } from "@/server/lib/auth/auth";
import {
    getAllTicketsService,
    getSupportTicketsQuerySchema,
} from "@/server/modules/support";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/support/tickets
// Get all support tickets (Admin/Support staff)
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await authenticate(req);

        const { searchParams } = new URL(req.url);
        const query = getSupportTicketsQuerySchema.parse({
            status: searchParams.get("status") || "all",
            page: searchParams.get("page") || "1",
            limit: searchParams.get("limit") || "20",
        });

        const result = await getAllTicketsService(payload, query);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
