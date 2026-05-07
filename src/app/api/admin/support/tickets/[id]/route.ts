import { handleApiError } from "@/server/core/http/http-errors";
import { authenticate } from "@/server/lib/auth/auth";
import {
    deleteTicketService,
    updateSupportTicketSchema,
    updateTicketService,
} from "@/server/modules/support";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// PATCH /api/admin/support/tickets/:id
// Update a support ticket (Admin/Support staff)
// ─────────────────────────────────────────────

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await authenticate(req);
        const { id } = await params;
        const ticketId = parseInt(id, 10);

        if (isNaN(ticketId)) {
            return NextResponse.json(
                { error: "Invalid ticket ID" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const data = updateSupportTicketSchema.parse(body);

        const result = await updateTicketService(payload, ticketId, data);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// DELETE /api/admin/support/tickets/:id
// Delete a support ticket (Admin only)
// ─────────────────────────────────────────────

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await authenticate(req);
        const { id } = await params;
        const ticketId = parseInt(id, 10);

        if (isNaN(ticketId)) {
            return NextResponse.json(
                { error: "Invalid ticket ID" },
                { status: 400 }
            );
        }

        const result = await deleteTicketService(payload, ticketId);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
