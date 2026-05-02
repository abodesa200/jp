import { z } from "zod";

// ─────────────────────────────────────────────
// Driver nested schema
// ─────────────────────────────────────────────

const driverInfoSchema = z.object({
    carModel: z.string().min(2).optional(),
    carPlate: z.string().min(3).max(10).optional(),
    carColor: z.string().min(2).optional(),
    carYear: z.number().int().min(1990).max(2030).optional(),
});

// ─────────────────────────────────────────────
// Update Profile Schema
// ─────────────────────────────────────────────

export const updateProfileSchema = z.object({
    name: z.string().min(2).max(50).optional(),

    email: z.string().email().optional(),

    avatarUrl: z.string().url().optional(),

    driverInfo: driverInfoSchema.optional(),
});

// ─────────────────────────────────────────────
// Type inference (important)
// ─────────────────────────────────────────────

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;