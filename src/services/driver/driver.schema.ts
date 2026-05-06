import { z } from "zod";

// ─────────────────────────────────────────────
// Get Drivers Query Schema (Admin)
// ─────────────────────────────────────────────

export const getDriversQuerySchema = z.object({
    isApproved: z
        .string()
        .optional()
        .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    isOnline: z
        .string()
        .optional()
        .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─────────────────────────────────────────────
// Create Driver Schema (Admin)
// ─────────────────────────────────────────────

export const createDriverSchema = z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    name: z.string().min(1),
    licenseNumber: z.string().min(1),
    carModel: z.string().min(1),
    carPlate: z.string().min(1),
    carColor: z.string().optional(),
    carYear: z.number().int().min(1900).max(2100).optional(),
    isApproved: z.boolean().default(false),
}).refine((data) => data.email || data.phone, {
    message: "Either email or phone must be provided",
});

// ─────────────────────────────────────────────
// Update Driver Schema (Admin)
// ─────────────────────────────────────────────

export const updateDriverSchema = z.object({
    licenseNumber: z.string().min(1).optional(),
    carModel: z.string().min(1).optional(),
    carPlate: z.string().min(1).optional(),
    carColor: z.string().optional(),
    carYear: z.number().int().min(1900).max(2100).optional(),
    isApproved: z.boolean().optional(),
    isOnline: z.boolean().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
});

// ─────────────────────────────────────────────
// Update Driver Profile Schema (Driver)
// ─────────────────────────────────────────────

export const updateDriverProfileSchema = z.object({
    licenseNumber: z.string().min(1).optional(),
    carModel: z.string().min(1).optional(),
    carPlate: z.string().min(1).optional(),
    carColor: z.string().optional(),
    carYear: z.number().int().min(1900).max(2100).optional(),
    isOnline: z.boolean().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
});

// ─────────────────────────────────────────────
// Driver Status Schema
// ─────────────────────────────────────────────

export const driverStatusSchema = z.object({
    isOnline: z.boolean(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
});

// ─────────────────────────────────────────────
// Nearby Drivers Query Schema
// ─────────────────────────────────────────────

export const nearbyDriversQuerySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    radius: z.coerce.number().min(1).max(50).default(10), // km
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type GetDriversQueryDTO = z.infer<typeof getDriversQuerySchema>;
export type CreateDriverDTO = z.infer<typeof createDriverSchema>;
export type UpdateDriverDTO = z.infer<typeof updateDriverSchema>;
export type UpdateDriverProfileDTO = z.infer<typeof updateDriverProfileSchema>;
export type DriverStatusDTO = z.infer<typeof driverStatusSchema>;
export type NearbyDriversQueryDTO = z.infer<typeof nearbyDriversQuerySchema>;
