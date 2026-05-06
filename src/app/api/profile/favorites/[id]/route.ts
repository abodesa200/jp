import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { deleteFavoriteService } from "@/services/favorites/favorites.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// DELETE /api/profile/favorites/[id] - Delete favorite
// ─────────────────────────────────────────────

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const { id } = await params;
        const favoriteId = parseInt(id);

        if (isNaN(favoriteId)) {
            return Response.json(
                { success: false, error: "Invalid favorite ID" },
                { status: 400 }
            );
        }

        const result = await deleteFavoriteService(payload, favoriteId);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
