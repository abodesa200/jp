import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { deleteNotificationService } from "@/services/notification/notification.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// DELETE /api/notifications/[id] - Delete notification
// ─────────────────────────────────────────────

export async function DELETE(
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

        const result = await deleteNotificationService(payload, notificationId);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
