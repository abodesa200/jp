import { z } from "zod";

export const rideFilterSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
    status: z.enum(["REQUESTED", "ACCEPTED", "DRIVER_ARRIVED", "IN_PROGRESS", "COMPLETED", "CLIENT_CANCELLED", "DRIVER_CANCELLED", "CANCELLED"]).optional(),
    type: z.enum(["STANDARD", "CARPOOLING"]).optional(),
    search: z.string().optional(),
});

export const createRideSchema = z.object({
    clientId: z.number(),
    pickupLat: z.number().min(-90).max(90),
    pickupLng: z.number().min(-180).max(180),
    dropoffLat: z.number().min(-90).max(90),
    dropoffLng: z.number().min(-180).max(180),
    pickupAddress: z.string().optional(),
    dropoffAddress: z.string().optional(),
    type: z.enum(["STANDARD", "CARPOOLING"]).default("STANDARD"),
});

export type RideFilterInput = z.infer<typeof rideFilterSchema>;
export type CreateRideInput = z.infer<typeof createRideSchema>;
