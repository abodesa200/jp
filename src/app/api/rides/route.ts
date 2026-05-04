/**
 * Rides API Routes
 * Thin layer that delegates to the controller
 */

import { rideController } from "@/server/modules/rides/ride.controller";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/rides - إنشاء رحلة جديدة
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  return rideController.createRide(req);
}

// ─────────────────────────────────────────────
// GET /api/rides - جلب رحلات المستخدم
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  return rideController.getUserRides(req);
}
