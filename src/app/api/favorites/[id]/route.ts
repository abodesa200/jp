import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { deleteFavoriteService } from "@/server/modules/favorites";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// DELETE /api/profile/favorites/[id] - Delete favorite
// ─────────────────────────────────────────────

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);

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
