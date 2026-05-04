/**
 * Accept Ride API Route
 */

import { rideController } from "@/server/modules/rides/ride.controller";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/rides/:id/accept - Driver accepts ride
// ─────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return rideController.acceptRide(req, id);
}
