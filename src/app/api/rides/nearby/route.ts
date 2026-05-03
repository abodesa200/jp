import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { getNearbyRidesService } from "@/services/rides/ride-query.service";
import { getNearbyRidesQuerySchema } from "@/services/rides/ride.schema";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/rides/nearby - أقرب الرحلات المتاحة للسائق
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  try {
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
