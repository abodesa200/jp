import { handleApiError } from "@/server/core/http/http-errors";
import { authenticate } from "@/server/lib/auth/auth";
import { getUserStatsService } from "@/server/modules/admin";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/stats/users
// Get user statistics
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await authenticate(req);

        const result = await getUserStatsService(payload);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
