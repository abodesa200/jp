import { handleApiError } from "@/core/http/error-handler";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { acceptRideService } from "@/services/rides/ride-status.service";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/rides/:id/accept - Driver accepts ride
// ─────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  try {
    const { id } = await params;
    const result = await acceptRideService(payload, id);

    return Response.json({
      success: true,
      data: result,
      message: "Ride accepted successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
