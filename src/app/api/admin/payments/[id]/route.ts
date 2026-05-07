import { handleApiError } from "@/server/core/http/http-errors";
import { authenticate } from "@/server/lib/auth/auth";
import {
    getPaymentByIdService,
    updatePaymentSchema,
    updatePaymentService,
} from "@/server/modules/admin";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/payments/:id
// Get payment by ID
// ─────────────────────────────────────────────

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await authenticate(req);
        const { id } = await params;
        const paymentId = parseInt(id, 10);

        if (isNaN(paymentId)) {
            return NextResponse.json(
                { error: "Invalid payment ID" },
                { status: 400 }
            );
        }

        const result = await getPaymentByIdService(payload, paymentId);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// PATCH /api/admin/payments/:id
// Update payment
// ─────────────────────────────────────────────

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await authenticate(req);
        const { id } = await params;
        const paymentId = parseInt(id, 10);

        if (isNaN(paymentId)) {
            return NextResponse.json(
                { error: "Invalid payment ID" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const data = updatePaymentSchema.parse(body);

        const result = await updatePaymentService(payload, paymentId, data);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
