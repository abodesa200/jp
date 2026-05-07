import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    joinCarpoolingSchema,
    joinCarpoolingService,
} from "@/server/modules/rides/carpooling";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/rides/[id]/join - Join carpooling ride
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
        const data = joinCarpoolingSchema.parse(body);

        const result = await joinCarpoolingService(payload, rideId, data);

        return Response.json({
            success: true,
            data: result,
        }, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
