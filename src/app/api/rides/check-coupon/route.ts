import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { checkCouponService } from "@/server/modules/rides/rides.service";
import { calculateDistance, calculateFare } from "@/server/modules/rides/rides.utils";
import { NextRequest } from "next/server";
import { z } from "zod";

// ─────────────────────────────────────────────
// GET /api/rides/check-coupon
//
// Option A – already have the fare (from calculate-price):
//   ?code=SAVE20&systemFare=12.50
//
// Option B – don't have the fare yet, send coordinates:
//   ?code=SAVE20&pickupLat=33.51&pickupLng=36.29&dropoffLat=33.52&dropoffLng=36.30
//   &serviceType=STANDARD&rideMode=PRIVATE
// ─────────────────────────────────────────────

const checkCouponQuerySchema = z
    .object({
        code: z.string().min(1),
        systemFare: z.coerce.number().positive().optional(),
        pickupLat: z.coerce.number().optional(),
        pickupLng: z.coerce.number().optional(),
        dropoffLat: z.coerce.number().optional(),
        dropoffLng: z.coerce.number().optional(),
        serviceType: z.enum(["STANDARD", "VIP", "VAN"]).default("STANDARD"),
        rideMode: z.enum(["PRIVATE", "CARPOOLING"]).default("PRIVATE"),
    })
    .superRefine((data, ctx) => {
        // must provide either systemFare OR all four coordinates
        if (!data.systemFare) {
            const missing = (["pickupLat", "pickupLng", "dropoffLat", "dropoffLng"] as const).filter(
                (k) => data[k] === undefined
            );
            if (missing.length > 0) {
                ctx.addIssue({
                    code: "custom",
                    message: `Provide either systemFare or all coordinates (missing: ${missing.join(", ")})`,
                    path: ["systemFare"],
                });
            }
        }
    });

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const { searchParams } = req.nextUrl;

        const data = checkCouponQuerySchema.parse({
            code: searchParams.get("code"),
            systemFare: searchParams.get("systemFare") ?? undefined,
            pickupLat: searchParams.get("pickupLat") ?? undefined,
            pickupLng: searchParams.get("pickupLng") ?? undefined,
            dropoffLat: searchParams.get("dropoffLat") ?? undefined,
            dropoffLng: searchParams.get("dropoffLng") ?? undefined,
            serviceType: searchParams.get("serviceType") ?? undefined,
            rideMode: searchParams.get("rideMode") ?? undefined,
        });

        // resolve systemFare
        const systemFare =
            data.systemFare ??
            calculateFare(
                calculateDistance(
                    data.pickupLat!,
                    data.pickupLng!,
                    data.dropoffLat!,
                    data.dropoffLng!
                ),
                data.serviceType,
                data.rideMode
            );

        const result = await checkCouponService(payload, data.code, systemFare);

        return Response.json({ success: true, data: result });
    } catch (error) {
        return handleApiError(error);
    }
}
