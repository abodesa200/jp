import { z } from "zod";

// ─────────────────────────────────────────────
// Apply Promo Code Schema
// ─────────────────────────────────────────────

export const applyPromoSchema = z.object({
    code: z.string().min(1).max(50).toUpperCase(),
});

// ─────────────────────────────────────────────
// Create Promo Code Schema (Admin)
// ─────────────────────────────────────────────

export const createPromoSchema = z.object({
    code: z.string().min(3).max(50).toUpperCase(),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    discountValue: z.number().positive(),
    expiresAt: z.string().optional(),
    maxUses: z.number().int().positive().optional(),
    isActive: z.boolean().default(true),
}).refine(
    (data) => data.discountType !== "PERCENTAGE" || data.discountValue <= 100,
    { message: "Percentage discount cannot exceed 100%" }
);

// ─────────────────────────────────────────────
// Get Promo Codes Query Schema
// ─────────────────────────────────────────────

export const getPromoCodesQuerySchema = z.object({
    isActive: z
        .string()
        .optional()
        .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type ApplyPromoDTO = z.infer<typeof applyPromoSchema>;
export type CreatePromoDTO = z.infer<typeof createPromoSchema>;
export type GetPromoCodesQueryDTO = z.infer<typeof getPromoCodesQuerySchema>;
