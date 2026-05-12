
import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { getDashboardStatsService } from "@/server/modules/admin";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/stats
// Get dashboard statistics
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyToken(req);

    const result = await getDashboardStatsService(payload);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
