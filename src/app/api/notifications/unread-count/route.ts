import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { getUnreadCountService } from "@/server/modules/notifications";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/notifications/unread-count
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const result = await getUnreadCountService(payload);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
