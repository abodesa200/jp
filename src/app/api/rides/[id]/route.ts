import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { getRideDetailsService } from "@/services/rides/ride-query.service";
import { updateRideStatusService } from "@/services/rides/ride-status.service";
import { updateRideStatusSchema } from "@/services/rides/ride.schema";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/rides/:id - تفاصيل رحلة
// ─────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  try {
    const { id } = await params;
    const result = await getRideDetailsService(payload, id);

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// PATCH /api/rides/:id - تحديث حالة الرحلة
// ─────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateRideStatusSchema.parse(body);

    const result = await updateRideStatusService(payload, id, data);

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
