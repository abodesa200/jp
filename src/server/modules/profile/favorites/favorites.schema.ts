import { z } from "zod";

// ─────────────────────────────────────────────
// Add Favorite Location Schema
// ─────────────────────────────────────────────

export const addFavoriteSchema = z.object({
    name: z.string().min(1).max(100),
    address: z.string().max(300).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type AddFavoriteDTO = z.infer<typeof addFavoriteSchema>;
