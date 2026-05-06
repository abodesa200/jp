import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { updateDriverStatusService } from "@/services/driver/driver-status.service";
import { driverStatusSchema } from "@/services/driver/driver.schema";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/drivers/status - Update driver status
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    try {
        const body = await req.json();
        const data = driverStatusSchema.parse(body);

        const result = await updateDriverStatusService(payload, data);

        return Response.json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleApiError(error);
    }
}
