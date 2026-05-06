import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { updateSupportTicketSchema } from "@/services/support/support.schema";
import {
    getSupportTicketByIdService,
    updateSupportTicketService,
} from "@/services/support/support.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/support/tickets/[id] - Get ticket details
// ─────────────────────────────────────────────

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const { id } = await params;
        const ticketId = parseInt(id);

        if (isNaN(ticketId)) {
            return Response.json(
                { success: false, error: "Invalid ticket ID" },
                { status: 400 }
            );
        }

        const result = await getSupportTicketByIdService(payload, ticketId);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// PATCH /api/support/tickets/[id] - Update ticket
// ─────────────────────────────────────────────

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const { id } = await params;
        const ticketId = parseInt(id);

        if (isNaN(ticketId)) {
            return Response.json(
                { success: false, error: "Invalid ticket ID" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const data = updateSupportTicketSchema.parse(body);

        const result = await updateSupportTicketService(payload, ticketId, data);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
