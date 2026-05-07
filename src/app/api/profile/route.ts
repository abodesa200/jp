import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { updateClientProfileSchema } from "@/server/modules/profile/profile.schema";
import {
    getClientProfileService,
    updateClientProfileService,
} from "@/server/modules/profile/profile.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/profile - Get client profile
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);
        const user = await getClientProfileService(payload);

        return Response.json({
            success: true,
            user,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// PATCH /api/profile - Update client profile
// ─────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
    try {
        const payload = await verifyToken(req);
        const body = await req.json();
        const data = updateClientProfileSchema.parse(body);

        const result = await updateClientProfileService(payload, data);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}