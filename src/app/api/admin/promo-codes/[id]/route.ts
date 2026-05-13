import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    deletePromoCodeService,
    getPromoCodeByIdService,
    updatePromoCodeSchema,
    updatePromoCodeService,
} from "@/server/modules/admin";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/promo-codes/:id
// Get promo code by ID
// ─────────────────────────────────────────────

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);
        const { id } = await params;
        const promoId = parseInt(id, 10);

        if (isNaN(promoId)) {
            return NextResponse.json(
                { error: "Invalid promo code ID" },
                { status: 400 }
            );
        }

        const result = await getPromoCodeByIdService(payload, promoId);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// PATCH /api/admin/promo-codes/:id
// Update promo code
// ─────────────────────────────────────────────

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);
        const { id } = await params;
        const promoId = parseInt(id, 10);

        if (isNaN(promoId)) {
            return NextResponse.json(
                { error: "Invalid promo code ID" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const data = updatePromoCodeSchema.parse(body);

        const result = await updatePromoCodeService(payload, promoId, data);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// DELETE /api/admin/promo-codes/:id
// Delete promo code
// ─────────────────────────────────────────────

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);
        const { id } = await params;
        const promoId = parseInt(id, 10);

        if (isNaN(promoId)) {
            return NextResponse.json(
                { error: "Invalid promo code ID" },
                { status: 400 }
            );
        }

        const result = await deletePromoCodeService(payload, promoId);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
