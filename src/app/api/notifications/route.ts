import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    deleteAllNotificationsService,
    getUserNotificationsService,
    markAllNotificationsAsReadService,
} from "@/server/modules/notifications";
import { getNotificationsQuerySchema } from "@/server/modules/notifications/notification.schema";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/notifications
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        // Parse query params
        const { searchParams } = new URL(req.url);
        const query = getNotificationsQuerySchema.parse({
            limit: searchParams.get("limit"),
            offset: searchParams.get("offset"),
            unreadOnly: searchParams.get("unreadOnly"),
        });

        const result = await getUserNotificationsService(payload, query);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// PATCH /api/notifications (Mark All as Read)
// ─────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const result = await markAllNotificationsAsReadService(payload);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// DELETE /api/notifications (Delete All)
// ─────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const result = await deleteAllNotificationsService(payload);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
