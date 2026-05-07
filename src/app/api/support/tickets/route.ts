
import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    createSupportTicketSchema,
    createSupportTicketService,
    getSupportTicketsQuerySchema,
    getUserTicketsService,
} from "@/server/modules/support";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// POST /api/support/tickets
// Create a new support ticket
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const body = await req.json();
        const data = createSupportTicketSchema.parse(body);

        const result = await createSupportTicketService(payload, data);

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// GET /api/support/tickets
// Get user's own tickets
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const { searchParams } = new URL(req.url);
        const query = getSupportTicketsQuerySchema.parse({
            status: searchParams.get("status") || "all",
            page: searchParams.get("page") || "1",
            limit: searchParams.get("limit") || "20",
        });

        const result = await getUserTicketsService(payload, query);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
