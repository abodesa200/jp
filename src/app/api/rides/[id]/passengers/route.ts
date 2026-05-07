import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { getRidePassengersService } from "@/server/modules/rides/carpooling";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/rides/[id]/passengers - Get ride passengers
// ─────────────────────────────────────────────

export async function GET(
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

        const result = await getRidePassengersService(payload, rideId);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
