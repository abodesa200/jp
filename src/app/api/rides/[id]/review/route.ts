import { handleApiError } from "@/server/core/http/error-handler";
import { unauthorized, verifyToken } from "@/server/lib/auth/auth";
import {
    createReviewSchema,
    createReviewService,
    getRideReviewService,
} from "@/server/modules/profile/reviews";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/rides/[id]/review - Create review
// ─────────────────────────────────────────────

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);
        if (!payload) return unauthorized();

        const { id } = await params;
        const rideId = parseInt(id);

        if (isNaN(rideId)) {
            return Response.json(
                { success: false, error: "Invalid ride ID" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const data = createReviewSchema.parse(body);

        const result = await createReviewService(payload, rideId, data);

        return Response.json(
            {
                success: true,
                data: result,
            },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// GET /api/rides/[id]/review - Get ride review
// ─────────────────────────────────────────────

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);
        if (!payload) return unauthorized();

        const { id } = await params;
        const rideId = parseInt(id);

        if (isNaN(rideId)) {
            return Response.json(
                { success: false, error: "Invalid ride ID" },
                { status: 400 }
            );
        }

        const result = await getRideReviewService(payload, rideId);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
