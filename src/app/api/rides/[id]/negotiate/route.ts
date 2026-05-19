import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
  negotiateRideSchema,
  negotiateRideService,
  respondToNegotiationSchema,
  respondToNegotiationService,
} from "@/server/modules/rides/negotiation";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// POST /api/rides/:id/negotiate - إنشاء أو تحديث عرض تفاوض
// ─────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await verifyToken(req);

  try {
    const { id } = await params;
    const body = await req.json();
    const data = negotiateRideSchema.parse(body);

    const result = await negotiateRideService(payload, id, data);

    return Response.json({
      success: true,
      data: result,
      message: result.negotiation?.status === "PENDING"
        ? "Negotiation started successfully"
        : "Counter offer sent successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ─────────────────────────────────────────────
// PATCH /api/rides/:id/negotiate - قبول أو رفض التفاوض
// ─────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  try {
    const payload = await verifyToken(req);

    const { id } = await params;
    const body = await req.json();
    const data = respondToNegotiationSchema.parse(body);

    const result = await respondToNegotiationService(payload, id, data);

    return Response.json({
      success: true,
      data: result,
      message: data.action === "accept"
        ? "Negotiation accepted successfully"
        : "Negotiation rejected",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
