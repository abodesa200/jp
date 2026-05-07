import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    updateDriverLocationSchema,
    updateDriverLocationService,
} from "@/server/modules/drivers";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// PUT /api/drivers/location
// Update driver location (authenticated)
// ─────────────────────────────────────────────

export async function PUT(req: NextRequest) {
    try {
        const payload = await verifyToken(req);
        const body = await req.json();

        const validated = updateDriverLocationSchema.parse(body);
        const driver = await updateDriverLocationService(payload, validated);

        return NextResponse.json(driver);
    } catch (error) {
        return handleApiError(error);
    }
}
