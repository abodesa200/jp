import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { markNotificationAsReadService } from "@/services/notification/notification.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// PATCH /api/notifications/[id]/read - Mark as read
// ─────────────────────────────────────────────

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

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
