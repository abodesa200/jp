import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
  getRideDetailsService,
  updateRideStatusSchema,
  updateRideStatusService,
} from "@/server/modules/rides";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// GET /api/rides/:id - تفاصيل رحلة
// ─────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyToken(req);
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
  try {
    const payload = await verifyToken(req);
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
