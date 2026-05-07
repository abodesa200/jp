import { z } from "zod";

// ─────────────────────────────────────────────
// Get Promo Codes Query
// ─────────────────────────────────────────────

export const getPromoCodesQuerySchema = z.object({
    isActive: z.enum(["all", "active", "inactive"]).optional().default("all"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    search: z.string().optional(),
});

export type GetPromoCodesQueryDTO = z.infer<typeof getPromoCodesQuerySchema>;

// ─────────────────────────────────────────────
// Create Promo Code
// ─────────────────────────────────────────────

export const createPromoCodeSchema = z.object({
    code: z
        .string()
        .min(3, "Code must be at least 3 characters")
        .max(20, "Code must be less than 20 characters")
        .regex(/^[A-Z0-9]+$/, "Code must contain only uppercase letters and numbers"),
    discountType: z.enum(["PERCENTAGE", "FIXED"]),
    discountValue: z.number().positive("Discount value must be positive"),
    expiresAt: z.string().datetime().optional(),
    maxUses: z.number().int().positive().optional(),
    isActive: z.boolean().optional().default(true),
});

export type CreatePromoCodeDTO = z.infer<typeof createPromoCodeSchema>;

// ─────────────────────────────────────────────
// Update Promo Code
// ─────────────────────────────────────────────

export const updatePromoCodeSchema = z.object({
    code: z
        .string()
        .min(3)
        .max(20)
        .regex(/^[A-Z0-9]+$/)
        .optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
    discountValue: z.number().positive().optional(),
    expiresAt: z.string().datetime().optional(),
    maxUses: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
});

export type UpdatePromoCodeDTO = z.infer<typeof updatePromoCodeSchema>;
