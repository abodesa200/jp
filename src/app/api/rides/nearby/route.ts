import { handleApiError } from "@/server/core/http/error-handler";
import {  verifyToken } from "@/server/lib/auth/auth";
import {
  getNearbyRidesQuerySchema,
  getNearbyRidesService,
} from "@/server/modules/rides";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/rides/nearby - أقرب الرحلات المتاحة للسائق
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const payload = await verifyToken(req);

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
