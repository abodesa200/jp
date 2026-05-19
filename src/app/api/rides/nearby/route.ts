import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { getNearbyRidesQuerySchema } from "@/server/modules/rides/rides.schema";
import { getNearbyRidesService } from "@/server/modules/rides/rides.service";

import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/rides/nearby - أقرب الرحلات المتاحة للسائق
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {

  try {
    const payload = await verifyToken(req);

    const { searchParams } = new URL(req.url);
    const query = getNearbyRidesQuerySchema.parse({
      maxDistance: searchParams.get("maxDistance") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    const result = await getNearbyRidesService(payload, query);

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
