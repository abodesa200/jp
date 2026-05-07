import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    addFavoriteSchema,
    addFavoriteService,
    getFavoritesService,
} from "@/server/modules/profile/favorites";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/profile/favorites - Get favorite locations
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const result = await getFavoritesService(payload);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// POST /api/profile/favorites - Add favorite location
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const body = await req.json();
        const data = addFavoriteSchema.parse(body);

        const result = await addFavoriteService(payload, data);

        return Response.json(
            {
                success: true,
                data: result,
            },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}
