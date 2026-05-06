import { handleApiError } from "@/core/http/error-handler";
import { forbidden, unauthorized, verifyToken } from "@/services/auth/auth";
import {
    createDriverService,
    getDriversService,
} from "@/services/driver/driver-admin.service";
import { createDriverSchema, getDriversQuerySchema } from "@/services/driver/driver.schema";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/drivers - Get drivers list
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    try {
        const { searchParams } = new URL(req.url);
        const query = getDriversQuerySchema.parse({
            isApproved: searchParams.get("isApproved") || undefined,
            isOnline: searchParams.get("isOnline") || undefined,
            page: searchParams.get("page") || undefined,
            limit: searchParams.get("limit") || undefined,
        });

        const result = await getDriversService(query);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// POST /api/admin/drivers - Create new driver
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    try {
        const body = await req.json();
        const data = createDriverSchema.parse(body);

        const result = await createDriverService(data);

        return Response.json({
            success: true,
            data: result,
        }, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
