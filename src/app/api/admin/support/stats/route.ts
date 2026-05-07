import { handleApiError } from "@/server/core/http/http-errors";
import { authenticate } from "@/server/lib/auth/auth";
import { getTicketStatsService } from "@/server/modules/support";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/support/stats
// Get support ticket statistics (Admin/Support staff)
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await authenticate(req);

        const result = await getTicketStatsService(payload);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
