import { z } from "zod";

// ─────────────────────────────────────────────
// Update Client Profile Schema
// ─────────────────────────────────────────────

export const updateClientProfileSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().url().optional(),
});

// ─────────────────────────────────────────────
// Update Driver Profile Schema
// ─────────────────────────────────────────────

export const updateDriverProfileSchema = z.object({
    // User fields
    name: z.string().min(2).max(50).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().url().optional(),

    // Driver fields
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
// Type inference
// ─────────────────────────────────────────────

export type UpdateClientProfileDTO = z.infer<typeof updateClientProfileSchema>;
export type UpdateDriverProfileDTO = z.infer<typeof updateDriverProfileSchema>;
