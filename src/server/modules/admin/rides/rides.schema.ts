import { z } from "zod";

// ─────────────────────────────────────────────
// Get Rides Query
// ─────────────────────────────────────────────

export const getRidesQuerySchema = z.object({
    status: z
        .enum([
            "all",
            "REQUESTED",
            "ACCEPTED",
            "DRIVER_ARRIVED",
            "IN_PROGRESS",
            "COMPLETED",
            "CLIENT_CANCELLED",
            "DRIVER_CANCELLED",
            "CANCELLED",
        ])
        .optional()
        .default("all"),
    type: z.enum(["all", "STANDARD", "CARPOOLING"]).optional().default("all"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    search: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export type GetRidesQueryDTO = z.infer<typeof getRidesQuerySchema>;

// ─────────────────────────────────────────────
// Update Ride (Admin)
// ─────────────────────────────────────────────

export const updateRideSchema = z.object({
    status: z
        .enum([
            "REQUESTED",
            "ACCEPTED",
            "DRIVER_ARRIVED",
            "IN_PROGRESS",
            "COMPLETED",
            "CLIENT_CANCELLED",
            "DRIVER_CANCELLED",
            "CANCELLED",
        ])
        .optional(),
    cancelReason: z.string().optional(),
    fare: z.number().positive().optional(),
});

export type UpdateRideDTO = z.infer<typeof updateRideSchema>;

// ─────────────────────────────────────────────
// Assign Driver to Ride
// ─────────────────────────────────────────────

export const assignDriverSchema = z.object({
    driverId: z.number().int().positive(),
});

export type AssignDriverDTO = z.infer<typeof assignDriverSchema>;
