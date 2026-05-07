
import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
  deleteRideService,
  getRideByIdService,
  updateRideSchema,
  updateRideService,
} from "@/server/modules/admin";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/rides/:id
// Get ride by ID
// ─────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyToken(req);
    const { id } = await params;
    const rideId = parseInt(id, 10);

    if (isNaN(rideId)) {
      return NextResponse.json(
        { error: "Invalid ride ID" },
        { status: 400 }
      );
    }

    const result = await getRideByIdService(payload, rideId);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// PATCH /api/admin/rides/:id
// Update ride
// ─────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyToken(req);
    const { id } = await params;
    const rideId = parseInt(id, 10);

    if (isNaN(rideId)) {
      return NextResponse.json(
        { error: "Invalid ride ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = updateRideSchema.parse(body);

    const result = await updateRideService(payload, rideId, data);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// DELETE /api/admin/rides/:id
// Delete ride
// ─────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyToken(req);
    const { id } = await params;
    const rideId = parseInt(id, 10);

    if (isNaN(rideId)) {
      return NextResponse.json(
        { error: "Invalid ride ID" },
        { status: 400 }
      );
    }

    const result = await deleteRideService(payload, rideId);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
