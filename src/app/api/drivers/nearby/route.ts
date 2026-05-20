import { handleApiError } from "@/server/core/http/error-handler";
import {
    getNearbyDriversSchema,
    getNearbyDriversService,
} from "@/server/modules/drivers";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/drivers/nearby
// Get nearby drivers
// Query params: latitude, longitude, radiusKm (optional)
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const latitude = parseFloat(searchParams.get("latitude") || "");
        const longitude = parseFloat(searchParams.get("longitude") || "");
        const radiusKm = parseFloat(searchParams.get("radiusKm") || "5");

        if (isNaN(latitude) || isNaN(longitude)) {
            return NextResponse.json(
                { error: "Invalid latitude or longitude" },
                { status: 400 }
            );
        }

        const validated = getNearbyDriversSchema.parse({
            latitude,
            longitude,
            radiusKm,
        });

        const result = await getNearbyDriversService(validated);

        return NextResponse.json(result);
    } catch (error) {
        console.log("Error in GET /api/drivers/nearby:", error);
        return handleApiError(error);
    }
}
