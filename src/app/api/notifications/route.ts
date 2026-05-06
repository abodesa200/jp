import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { getNotificationsQuerySchema } from "@/services/notification/notification.schema";
import { getMyNotificationsService } from "@/services/notification/notification.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/notifications - Get my notifications
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const { searchParams } = new URL(req.url);
        const query = getNotificationsQuerySchema.parse({
            isRead: searchParams.get("isRead") || undefined,
            page: searchParams.get("page") || undefined,
            limit: searchParams.get("limit") || undefined,
        });

        const result = await getMyNotificationsService(payload, query);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
