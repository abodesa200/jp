import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { acceptRideService } from "@/server/modules/rides/status";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/rides/:id/accept - Driver accepts ride
// ─────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  try {
    const payload = await verifyToken(req);

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
