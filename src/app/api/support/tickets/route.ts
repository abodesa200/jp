import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import {
    createSupportTicketSchema,
    getSupportTicketsQuerySchema,
} from "@/services/support/support.schema";
import {
    createSupportTicketService,
    getMySupportTicketsService,
} from "@/services/support/support.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/support/tickets - Get my tickets
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const { searchParams } = new URL(req.url);
        const query = getSupportTicketsQuerySchema.parse({
            isResolved: searchParams.get("isResolved") || undefined,
            page: searchParams.get("page") || undefined,
            limit: searchParams.get("limit") || undefined,
        });

        const result = await getMySupportTicketsService(payload, query);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// POST /api/support/tickets - Create ticket
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const body = await req.json();
        const data = createSupportTicketSchema.parse(body);

        const result = await createSupportTicketService(payload, data);

        return Response.json({
            success: true,
            data: result,
        }, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
