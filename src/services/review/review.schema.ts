import { z } from "zod";

// ─────────────────────────────────────────────
// Create Review Schema
// ─────────────────────────────────────────────

export const createReviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
});

// ─────────────────────────────────────────────
// Get Reviews Query Schema
// ─────────────────────────────────────────────

export const getReviewsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type CreateReviewDTO = z.infer<typeof createReviewSchema>;
export type GetReviewsQueryDTO = z.infer<typeof getReviewsQuerySchema>;
