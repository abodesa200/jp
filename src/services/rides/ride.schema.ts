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
// Update Ride Status Schema
// ─────────────────────────────────────────────

export const updateRideStatusSchema = z.object({
    status: z.enum([
        "REQUESTED",
        "ACCEPTED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
    ]),
    cancelReason: z.string().optional(),
});

// ─────────────────────────────────────────────
// Cancel Ride Schema
// ─────────────────────────────────────────────

export const cancelRideSchema = z.object({
    reason: z.string().min(1).max(500).optional(),
});

// ─────────────────────────────────────────────
// Negotiate Ride Schema
// ─────────────────────────────────────────────

export const negotiateRideSchema = z.object({
    amount: z.number().positive(),
    message: z.string().max(500).optional(),
});

// ─────────────────────────────────────────────
// Respond to Negotiation Schema
// ─────────────────────────────────────────────

export const respondToNegotiationSchema = z.object({
    action: z.enum(["accept", "reject"]),
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type CreateRideDTO = z.infer<typeof createRideSchema>;
export type GetRidesQueryDTO = z.infer<typeof getRidesQuerySchema>;
export type GetNearbyRidesQueryDTO = z.infer<typeof getNearbyRidesQuerySchema>;
export type UpdateRideStatusDTO = z.infer<typeof updateRideStatusSchema>;
export type CancelRideDTO = z.infer<typeof cancelRideSchema>;
export type NegotiateRideDTO = z.infer<typeof negotiateRideSchema>;
export type RespondToNegotiationDTO = z.infer<typeof respondToNegotiationSchema>;
