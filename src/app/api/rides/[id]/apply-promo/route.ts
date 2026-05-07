import { handleApiError } from "@/server/core/http/error-handler";
import {  verifyToken } from "@/server/lib/auth/auth";
import { applyPromoSchema } from "@/services/promo/promo.schema";
import { applyPromoService } from "@/services/promo/promo.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/rides/[id]/apply-promo - Apply promo code
// ─────────────────────────────────────────────

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const payload = await verifyToken(req);

    try {
        const { id } = await params;
        const rideId = parseInt(id);

        if (isNaN(rideId)) {
            return Response.json(
                { success: false, error: "Invalid ride ID" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const data = applyPromoSchema.parse(body);

        const result = await applyPromoService(payload, rideId, data);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
