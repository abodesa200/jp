
import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { getRidesQuerySchema, getRidesService } from "@/server/modules/admin";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/rides
// Get rides list
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyToken(req);

    const { searchParams } = new URL(req.url);
    const query = getRidesQuerySchema.parse({
      status: searchParams.get("status") || "all",
      type: searchParams.get("type") || "all",
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    });

    const result = await getRidesService(payload, query);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
