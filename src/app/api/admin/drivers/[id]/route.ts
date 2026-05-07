
import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
    deleteDriverService,
    getDriverByIdService,
    updateDriverSchema,
    updateDriverService,
} from "@/server/modules/admin";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/drivers/:id
// Get driver by ID
// ─────────────────────────────────────────────

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);
        const { id } = await params;
        const driverId = parseInt(id, 10);

        if (isNaN(driverId)) {
            return NextResponse.json(
                { error: "Invalid driver ID" },
                { status: 400 }
            );
        }

        const result = await getDriverByIdService(payload, driverId);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// PATCH /api/admin/drivers/:id
// Update driver (approve/reject)
// ─────────────────────────────────────────────

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);
        const { id } = await params;
        const driverId = parseInt(id, 10);

        if (isNaN(driverId)) {
            return NextResponse.json(
                { error: "Invalid driver ID" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const data = updateDriverSchema.parse(body);

        const result = await updateDriverService(payload, driverId, data);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// DELETE /api/admin/drivers/:id
// Delete driver
// ─────────────────────────────────────────────

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);
        const { id } = await params;
        const driverId = parseInt(id, 10);

        if (isNaN(driverId)) {
            return NextResponse.json(
                { error: "Invalid driver ID" },
                { status: 400 }
            );
        }

        const result = await deleteDriverService(payload, driverId);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
