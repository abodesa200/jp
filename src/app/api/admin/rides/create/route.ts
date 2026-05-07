
import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
  createRideSchema,
  createRideService,
} from "@/server/modules/admin";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// POST /api/admin/rides/create
// Admin creates a ride manually
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const payload = await verifyToken(req);

    const body = await req.json();
    const data = createRideSchema.parse(body);

    const result = await createRideService(payload, data);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
