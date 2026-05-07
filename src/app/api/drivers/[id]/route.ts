import { handleApiError } from "@/server/core/http/error-handler";
import {
    getDriverProfileSchema,
    getDriverProfileService,
} from "@/server/modules/drivers";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/drivers/:id
// Get driver profile by ID
// ─────────────────────────────────────────────

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const driverId = parseInt(id);

        if (isNaN(driverId)) {
            return NextResponse.json(
                { error: "Invalid driver ID" },
                { status: 400 }
            );
        }

        const validated = getDriverProfileSchema.parse({ driverId });
        const driver = await getDriverProfileService(validated);

        return NextResponse.json(driver);
    } catch (error) {
        return handleApiError(error);
    }
}
