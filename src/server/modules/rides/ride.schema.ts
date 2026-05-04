/**
 * Ride Module Validation Schemas
 */

import { z } from "zod";

export const createRideSchema = z.object({
    pickupLat: z.number().min(-90).max(90),
    pickupLng: z.number().min(-180).max(180),
    pickupAddress: z.string().min(1),
    dropoffLat: z.number().min(-90).max(90),
    dropoffLng: z.number().min(-180).max(180),
    dropoffAddress: z.string().min(1),
    type: z.enum(["STANDARD", "CARPOOLING"]),
    maxPassengers: z.number().int().min(1).max(8).optional().default(1),
});

export const getRidesQuerySchema = z.object({
    status: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const negotiateRideSchema = z.object({
    amount: z.number().positive(),
    message: z.string().optional(),
});

export const respondToNegotiationSchema = z.object({
    action: z.enum(["accept", "reject"]),
});

export type CreateRideDTO = z.infer<typeof createRideSchema>;
export type GetRidesQueryDTO = z.infer<typeof getRidesQuerySchema>;
export type NegotiateRideDTO = z.infer<typeof negotiateRideSchema>;
export type RespondToNegotiationDTO = z.infer<typeof respondToNegotiationSchema>;
