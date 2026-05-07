import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    getSettingsService,
    updateSettingsSchema,
    updateSettingsService,
} from "@/server/modules/profile/settings";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/profile/settings - Get user settings
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const result = await getSettingsService(payload);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// PATCH /api/profile/settings - Update user settings
// ─────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const body = await req.json();
        const data = updateSettingsSchema.parse(body);

        const result = await updateSettingsService(payload, data);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
