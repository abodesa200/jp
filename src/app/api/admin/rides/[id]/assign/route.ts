
import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    assignDriverSchema,
    assignDriverService,
} from "@/server/modules/admin";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// POST /api/admin/rides/:id/assign
// Assign driver to ride
// ─────────────────────────────────────────────

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);
        const { id } = await params;
        const rideId = parseInt(id, 10);

        if (isNaN(rideId)) {
            return NextResponse.json(
                { error: "Invalid ride ID" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const data = assignDriverSchema.parse(body);

        const result = await assignDriverService(payload, rideId, data);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
