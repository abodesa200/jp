import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { SERVICE_RULES } from "./config";

extendZodWithOpenApi(z);


// ─────────────────────────────────────────────
// Create Ride Schema
// ─────────────────────────────────────────────

export const createRideOpenApiSchema = z.object({
  pickupLat:      z.number().min(-90).max(90),
  pickupLng:      z.number().min(-180).max(180),
  pickupAddress:  z.string().optional(),
  dropoffLat:     z.number().min(-90).max(90),
  dropoffLng:     z.number().min(-180).max(180),
  dropoffAddress: z.string().optional(),

  serviceType: z.enum(["STANDARD", "VIP", "VAN"]).default("STANDARD").openapi({
    description: "STANDARD = سيارة عادية | VIP = سيارة فاخرة | VAN = فان",
    example: "STANDARD",
  }),
  rideMode: z.enum(["PRIVATE", "CARPOOLING"]).default("PRIVATE").openapi({
    description: "PRIVATE = لحالك | CARPOOLING = مشاركة مع ركاب آخرين",
    example: "PRIVATE",
  }),
  rideFlow: z.enum(["NORMAL", "NEGOTIATION"]).default("NORMAL").openapi({
    description: "NORMAL = سعر ثابت | NEGOTIATION = تفاوض على السعر",
    example: "NORMAL",
  }),
  maxPassengers: z.number().int().min(1).max(8).default(1),
  clientOffer:   z.number().positive().optional().openapi({
    description: "مطلوب فقط إذا rideFlow = NEGOTIATION",
    example: 12.5,
  }),
}).openapi("CreateRideBody");

export const createRideSchema = createRideOpenApiSchema.superRefine((data, ctx) => {
  const rules = SERVICE_RULES[data.serviceType];

  // 1. maxPassengers vs serviceType
  if (data.maxPassengers > rules.maxPassengers) {
    ctx.addIssue({
      code: "custom",
      path: ["maxPassengers"],
      message: `${data.serviceType} supports max ${rules.maxPassengers} passengers`,
    });
  }

  // 2. CARPOOLING vs serviceType
  if (data.rideMode === "CARPOOLING" && !rules.allowCarpooling) {
    ctx.addIssue({
      code: "custom",
      path: ["rideMode"],
      message: `${data.serviceType} does not support carpooling`,
    });
  }

  // 3. CARPOOLING + NEGOTIATION ممنوع
  if (data.rideMode === "CARPOOLING" && data.rideFlow === "NEGOTIATION") {
    ctx.addIssue({
      code: "custom",
      path: ["rideFlow"],
      message: "Negotiation is not allowed in carpooling rides",
    });
  }

  // 4. NEGOTIATION بدون clientOffer ممنوع
  if (data.rideFlow === "NEGOTIATION" && !data.clientOffer) {
    ctx.addIssue({
      code: "custom",
      path: ["clientOffer"],
      message: "clientOffer is required when rideFlow is NEGOTIATION",
    });
  }

  // 5. PRIVATE + maxPassengers > 1 ممنوع
  if (data.rideMode === "PRIVATE" && data.maxPassengers > 1) {
    ctx.addIssue({
      code: "custom",
      path: ["maxPassengers"],
      message: "Private rides can only have 1 passenger",
    });
  }
});

// ─────────────────────────────────────────────
// Get Rides Query Schema
// ─────────────────────────────────────────────

export const getRidesQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ─────────────────────────────────────────────
// Get Nearby Rides Query Schema
// ─────────────────────────────────────────────

export const getNearbyRidesQuerySchema = z.object({
  maxDistance: z.coerce.number().min(1).max(50).default(10),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type CreateRideDTO = z.infer<typeof createRideSchema>;
export type GetRidesQueryDTO = z.infer<typeof getRidesQuerySchema>;
export type GetNearbyRidesQueryDTO = z.infer<typeof getNearbyRidesQuerySchema>;