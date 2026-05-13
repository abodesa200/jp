import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
  cancelRideSchema,
  cancelRideService,
} from "@/server/modules/rides/status";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/rides/:id/cancel - Cancel ride
// ─────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyToken(req);
    const { id } = await params;
    const body = await req.json();
    const data = cancelRideSchema.parse(body);

    const result = await cancelRideService(payload, id, data);

    return Response.json({
      success: true,
      data: result,
      message: "Ride cancelled successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
