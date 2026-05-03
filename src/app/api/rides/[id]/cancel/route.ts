import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { cancelRideService } from "@/services/rides/ride-status.service";
import { cancelRideSchema } from "@/services/rides/ride.schema";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/rides/:id/cancel - Cancel ride
// ─────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  try {
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
