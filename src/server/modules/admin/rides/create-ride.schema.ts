import { z } from "zod";

// ─────────────────────────────────────────────
// Create Ride (Admin)
// ─────────────────────────────────────────────

export const createRideSchema = z.object({
    clientId: z.number().int().positive("Client ID is required"),
    driverId: z.number().int().positive().optional(),
    pickupLat: z
        .number()
        .min(-90, "Invalid latitude")
        .max(90, "Invalid latitude"),
    pickupLng: z
        .number()
        .min(-180, "Invalid longitude")
        .max(180, "Invalid longitude"),
    pickupAddress: z.string().optional(),
    dropoffLat: z
        .number()
        .min(-90, "Invalid latitude")
        .max(90, "Invalid latitude"),
    dropoffLng: z
        .number()
        .min(-180, "Invalid longitude")
        .max(180, "Invalid longitude"),
    dropoffAddress: z.string().optional(),
    type: z.enum(["STANDARD", "CARPOOLING"]).optional().default("STANDARD"),
    maxPassengers: z.number().int().min(1).max(4).optional(),
    notes: z.string().optional(),
});

export type CreateRideDTO = z.infer<typeof createRideSchema>;
