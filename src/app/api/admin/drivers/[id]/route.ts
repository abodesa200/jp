import { handleApiError } from "@/core/http/error-handler";
import { forbidden, unauthorized, verifyToken } from "@/services/auth/auth";
import {
    deleteDriverService,
    getDriverByIdService,
    updateDriverService,
} from "@/services/driver/driver-admin.service";
import { updateDriverSchema } from "@/services/driver/driver.schema";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/drivers/[id] - Get driver details
// ─────────────────────────────────────────────

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    try {
        const { id } = await params;
        const driverId = parseInt(id);

        if (isNaN(driverId)) {
            return Response.json(
                { success: false, error: "Invalid driver ID" },
                { status: 400 }
            );
        }

        const result = await getDriverByIdService(driverId);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// PATCH /api/admin/drivers/[id] - Update driver
// ─────────────────────────────────────────────

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    try {
        const { id } = await params;
        const driverId = parseInt(id);

        if (isNaN(driverId)) {
            return Response.json(
                { success: false, error: "Invalid driver ID" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const data = updateDriverSchema.parse(body);

        const result = await updateDriverService(driverId, data);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// DELETE /api/admin/drivers/[id] - Delete driver
// ─────────────────────────────────────────────

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    try {
        const { id } = await params;
        const driverId = parseInt(id);

        if (isNaN(driverId)) {
            return Response.json(
                { success: false, error: "Invalid driver ID" },
                { status: 400 }
            );
        }

        const result = await deleteDriverService(driverId);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
