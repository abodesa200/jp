import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { createRideSchema, getRidesQuerySchema } from "@/server/modules/rides/rides.schema";
import { createRideService, getUserRidesService } from "@/server/modules/rides/rides.service";

import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/rides 
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const payload = await verifyToken(req);
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
// GET /api/rides  
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const payload = await verifyToken(req);

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
