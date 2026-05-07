import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { getTicketByIdService } from "@/server/modules/support";
import { NextRequest, NextResponse } from "next/server";


export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);
        const { id } = await params;
        const ticketId = parseInt(id, 10);

        if (isNaN(ticketId)) {
            return NextResponse.json(
                { error: "Invalid ticket ID" },
                { status: 400 }
            );
        }

        const result = await getTicketByIdService(payload, ticketId);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
