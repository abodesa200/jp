import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { addFavoriteSchema } from "@/services/favorites/favorites.schema";
import { addFavoriteService, getFavoritesService } from "@/services/favorites/favorites.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/profile/favorites - Get favorite locations
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
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
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const body = await req.json();
        const data = addFavoriteSchema.parse(body);

        const result = await addFavoriteService(payload, data);

        return Response.json({
            success: true,
            data: result,
        }, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
