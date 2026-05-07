import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    createBulkNotificationsService,
    createNotificationService,
} from "@/server/modules/notifications";
import {
    createBulkNotificationsSchema,
    createNotificationSchema,
} from "@/server/modules/notifications/notification.schema";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// POST /api/admin/notifications/send
// Send notification to single user or multiple users
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const payload = await verifyToken(req);
        const body = await req.json();

        // Check if it's a single notification or bulk
        if (body.userId) {
            // Single notification
            const data = createNotificationSchema.parse(body);
            const result = await createNotificationService(payload, data);
            return NextResponse.json(result);
        } else if (body.userIds) {
            // Bulk notifications
            const data = createBulkNotificationsSchema.parse(body);
            const result = await createBulkNotificationsService(payload, data);
            return NextResponse.json(result);
        } else {
            return NextResponse.json(
                { error: "Either userId or userIds must be provided" },
                { status: 400 }
            );
        }
    } catch (error) {
        return handleApiError(error);
    }
}
