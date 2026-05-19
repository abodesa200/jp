import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    createPaymentSchema,
    createPaymentService,
    getRidePaymentService,
    updatePaymentSchema,
    updatePaymentService,
    
} from "@/server/modules/rides/payment";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/rides/[id]/payment - Create payment
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
        const data = createPaymentSchema.parse(body);

        const result = await createPaymentService(payload, rideId, data);

        return Response.json({
            success: true,
            data: result,
        }, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// GET /api/rides/[id]/payment - Get ride payment
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

        const result = await getRidePaymentService(payload, rideId);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// PATCH /api/rides/[id]/payment - Update payment
// ─────────────────────────────────────────────

export async function PATCH(
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
        const data = updatePaymentSchema.parse(body);

        const result = await updatePaymentService(payload, rideId, data);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
