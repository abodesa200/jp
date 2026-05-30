import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { addTipService } from "@/server/modules/rides/complete/tip.service";
import { NextRequest } from "next/server";
import { z } from "zod";

// ─────────────────────────────────────────────
// POST /api/rides/:id/tip
// العميل يختار مبلغ الـ tip
// ─────────────────────────────────────────────

const tipSchema = z.object({
    amount: z.number().min(0),
});

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await verifyToken(req);
        const { id } = await params;
        const body = await req.json();
        const { amount } = tipSchema.parse(body);

        const result = await addTipService(payload, id, amount);

        return Response.json({ success: true, data: result });
    } catch (error) {
        return handleApiError(error);
    }
}
