import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { updateDriverProfileSchema } from "@/server/modules/profile/profile.schema";
import {
    getDriverProfileService,
    updateDriverProfileService,
} from "@/server/modules/profile/profile.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/profile/driver - Get driver profile
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);
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
    try {
        const payload = await verifyToken(req);
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