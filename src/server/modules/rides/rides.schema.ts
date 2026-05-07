import { z } from "zod";

// ─────────────────────────────────────────────
// Create Ride Schema
// ─────────────────────────────────────────────

export const createRideSchema = z.object({
    pickupLat: z.number().min(-90).max(90),
    pickupLng: z.number().min(-180).max(180),
    pickupAddress: z.string().optional(),
    dropoffLat: z.number().min(-90).max(90),
    dropoffLng: z.number().min(-180).max(180),
    dropoffAddress: z.string().optional(),
    type: z.enum(["STANDARD", "CARPOOLING"]).default("STANDARD"),
    maxPassengers: z.number().int().min(1).max(6).default(1),
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
