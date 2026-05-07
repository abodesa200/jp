import { z } from "zod";

// ─────────────────────────────────────────────
// Get Driver Profile Schema
// ─────────────────────────────────────────────

export const getDriverProfileSchema = z.object({
    driverId: z.number().int().positive(),
});

// ─────────────────────────────────────────────
// Update Driver Location Schema
// ─────────────────────────────────────────────

export const updateDriverLocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});

// ─────────────────────────────────────────────
// Update Driver Status Schema
// ─────────────────────────────────────────────

export const updateDriverStatusSchema = z.object({
    isOnline: z.boolean(),
});

// ─────────────────────────────────────────────
// Get Nearby Drivers Schema
// ─────────────────────────────────────────────

export const getNearbyDriversSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radiusKm: z.number().positive().default(5),
});

// ─────────────────────────────────────────────
// Get Driver Stats Schema
// ─────────────────────────────────────────────

export const getDriverStatsSchema = z.object({
    driverId: z.number().int().positive(),
});

// ─────────────────────────────────────────────
// Get Driver Reviews Schema
// ─────────────────────────────────────────────

export const getDriverReviewsSchema = z.object({
    driverId: z.number().int().positive(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10),
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type GetDriverProfileDTO = z.infer<typeof getDriverProfileSchema>;
export type UpdateDriverLocationDTO = z.infer<typeof updateDriverLocationSchema>;
export type UpdateDriverStatusDTO = z.infer<typeof updateDriverStatusSchema>;
export type GetNearbyDriversDTO = z.infer<typeof getNearbyDriversSchema>;
export type GetDriverStatsDTO = z.infer<typeof getDriverStatsSchema>;
export type GetDriverReviewsDTO = z.infer<typeof getDriverReviewsSchema>;
