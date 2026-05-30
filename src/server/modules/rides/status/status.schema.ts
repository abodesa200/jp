import { z } from "zod";

// ─────────────────────────────────────────────
// Update Ride Status Schema
// ─────────────────────────────────────────────

export const updateRideStatusSchema = z.object({
    status: z.enum([
        "REQUESTED",
        "ACCEPTED",
        "DRIVER_ARRIVED",
        "IN_PROGRESS",
        "COMPLETED",
        "CLIENT_CANCELLED",
        "DRIVER_CANCELLED",
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
// Type inference
// ─────────────────────────────────────────────

export type UpdateRideStatusDTO = z.infer<typeof updateRideStatusSchema>;
export type CancelRideDTO = z.infer<typeof cancelRideSchema>;
