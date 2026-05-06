import { z } from "zod";

// ─────────────────────────────────────────────
// Update Settings Schema
// ─────────────────────────────────────────────

export const updateSettingsSchema = z.object({
    language: z.enum(["ar", "en"]).optional(),
    notifyRideUpdates: z.boolean().optional(),
    notifyPromotions: z.boolean().optional(),
    notifySystemMessages: z.boolean().optional(),
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type UpdateSettingsDTO = z.infer<typeof updateSettingsSchema>;
