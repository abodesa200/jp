import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { completeRideService } from "@/server/modules/rides/complete/complete.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/rides/:id/complete
// السائق يعلن اكتمال الرحلة واستلام الكاش
// ─────────────────────────────────────────────

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);
        const { id } = await params;

        const result = await completeRideService(payload, id);

        return Response.json({ success: true, data: result });
    } catch (error) {
        return handleApiError(error);
    }
}
