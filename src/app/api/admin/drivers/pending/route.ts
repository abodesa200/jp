
import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { getPendingDriversService } from "@/server/modules/admin";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/drivers/pending
// Get pending drivers (need approval)
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const result = await getPendingDriversService(payload);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
