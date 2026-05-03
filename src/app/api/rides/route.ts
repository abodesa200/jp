import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { createRideService } from "@/services/rides/ride-create.service";
import { getUserRidesService } from "@/services/rides/ride-query.service";
import { createRideSchema, getRidesQuerySchema } from "@/services/rides/ride.schema";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/rides - إنشاء رحلة جديدة
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const data = createRideSchema.parse(body);

    const result = await createRideService(payload, data);

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// GET /api/rides - جلب رحلات المستخدم
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const query = getRidesQuerySchema.parse({
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    const result = await getUserRidesService(payload, query);

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
