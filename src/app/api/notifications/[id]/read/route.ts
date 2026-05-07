import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { markNotificationAsReadService } from "@/server/modules/notifications";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// PATCH /api/notifications/[id]/read - Mark as read
// ─────────────────────────────────────────────

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const payload = await verifyToken(req);

    try {
        const { id } = await params;
        const notificationId = parseInt(id);

        if (isNaN(notificationId)) {
            return Response.json(
                { success: false, error: "Invalid notification ID" },
                { status: 400 }
            );
        }

        const result = await markNotificationAsReadService(payload, notificationId);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
