import { handleApiError } from "@/core/http/error-handler";
import { forbidden, unauthorized, verifyToken } from "@/services/auth/auth";
import { getSupportTicketsQuerySchema } from "@/services/support/support.schema";
import { getAllSupportTicketsService } from "@/services/support/support.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/support/tickets - Get all tickets (Admin)
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    try {
        const { searchParams } = new URL(req.url);
        const query = getSupportTicketsQuerySchema.parse({
            isResolved: searchParams.get("isResolved") || undefined,
            page: searchParams.get("page") || undefined,
            limit: searchParams.get("limit") || undefined,
        });

        const result = await getAllSupportTicketsService(query);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
