import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    updateDriverStatusSchema,
    updateDriverStatusService,
} from "@/server/modules/drivers";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// PUT /api/drivers/status
// Update driver status (online/offline) (authenticated)
// ─────────────────────────────────────────────

export async function PUT(req: NextRequest) {
    try {
        const payload = await verifyToken(req);
        const body = await req.json();

        const validated = updateDriverStatusSchema.parse(body);
        const driver = await updateDriverStatusService(payload, validated);

        return NextResponse.json(driver);
    } catch (error) {
        return handleApiError(error);
    }
}
