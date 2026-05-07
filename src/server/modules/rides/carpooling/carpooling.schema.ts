import { z } from "zod";

// ─────────────────────────────────────────────
// Join Carpooling Ride Schema
// ─────────────────────────────────────────────

export const joinCarpoolingSchema = z.object({
    pickupLat: z.number().min(-90).max(90),
    pickupLng: z.number().min(-180).max(180),
    pickupAddress: z.string().optional(),
    dropoffLat: z.number().min(-90).max(90),
    dropoffLng: z.number().min(-180).max(180),
    dropoffAddress: z.string().optional(),
});

// ─────────────────────────────────────────────
// Available Carpooling Rides Query Schema
// ─────────────────────────────────────────────

export const availableCarpoolingQuerySchema = z.object({
    pickupLat: z.coerce.number().min(-90).max(90),
    pickupLng: z.coerce.number().min(-180).max(180),
    dropoffLat: z.coerce.number().min(-90).max(90),
    dropoffLng: z.coerce.number().min(-180).max(180),
    radius: z.coerce.number().min(1).max(50).default(5), // km
    limit: z.coerce.number().int().min(1).max(20).default(10),
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type JoinCarpoolingDTO = z.infer<typeof joinCarpoolingSchema>;
export type AvailableCarpoolingQueryDTO = z.infer<
    typeof availableCarpoolingQuerySchema
>;
