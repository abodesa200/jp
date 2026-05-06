import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { updateSettingsSchema } from "@/services/settings/settings.schema";
import { getSettingsService, updateSettingsService } from "@/services/settings/settings.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/profile/settings - Get user settings
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
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
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
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
