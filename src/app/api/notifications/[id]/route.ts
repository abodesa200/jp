import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    deleteNotificationService,
    markNotificationAsReadService,
} from "@/server/modules/notifications";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// PATCH /api/notifications/:id (Mark as Read)
// ─────────────────────────────────────────────

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);
        const { id } = await params;
        const notificationId = parseInt(id, 10);

        if (isNaN(notificationId)) {
            return NextResponse.json(
                { error: "Invalid notification ID" },
                { status: 400 }
            );
        }

        const result = await markNotificationAsReadService(
            payload,
            notificationId
        );

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// DELETE /api/notifications/:id
// ─────────────────────────────────────────────

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);
        const { id } = await params;
        const notificationId = parseInt(id, 10);

        if (isNaN(notificationId)) {
            return NextResponse.json(
                { error: "Invalid notification ID" },
                { status: 400 }
            );
        }

        const result = await deleteNotificationService(payload, notificationId);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
