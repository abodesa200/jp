
import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    getDriversQuerySchema,
    getDriversService,
} from "@/server/modules/admin";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/drivers
// Get drivers list
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const { searchParams } = new URL(req.url);
        const query = getDriversQuerySchema.parse({
            isApproved: searchParams.get("isApproved") || "all",
            isOnline: searchParams.get("isOnline") || "all",
            page: searchParams.get("page") || "1",
            limit: searchParams.get("limit") || "20",
            search: searchParams.get("search") || undefined,
        });

        const result = await getDriversService(payload, query);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
