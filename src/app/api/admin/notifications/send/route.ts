import { handleApiError } from "@/core/http/error-handler";
import { forbidden, unauthorized, verifyToken } from "@/services/auth/auth";
import { sendNotificationSchema } from "@/services/notification/notification.schema";
import { sendNotificationService } from "@/services/notification/notification.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/admin/notifications/send - Send notification (Admin)
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    try {
        const body = await req.json();
        const data = sendNotificationSchema.parse(body);

        const result = await sendNotificationService(data);

        return Response.json({
            success: true,
            data: result,
        }, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
