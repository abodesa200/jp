import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import {
    getDriverProfileService,
    updateDriverProfileService,
} from "@/services/driver/driver-profile.service";
import { updateDriverProfileSchema } from "@/services/driver/driver.schema";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/profile/driver - Get driver profile
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const result = await getDriverProfileService(payload);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// PATCH /api/profile/driver - Update driver profile
// ─────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const body = await req.json();
        const data = updateDriverProfileSchema.parse(body);

        const result = await updateDriverProfileService(payload, data);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
