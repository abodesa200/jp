import { z } from "zod";

// ─────────────────────────────────────────────
// Get Payments Query
// ─────────────────────────────────────────────

export const getPaymentsQuerySchema = z.object({
    status: z
        .enum(["all", "PENDING", "PAID", "FAILED", "REFUNDED"])
        .optional()
        .default("all"),
    method: z
        .enum(["all", "CASH", "CARD", "WALLET"])
        .optional()
        .default("all"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export type GetPaymentsQueryDTO = z.infer<typeof getPaymentsQuerySchema>;

// ─────────────────────────────────────────────
// Update Payment (Admin)
// ─────────────────────────────────────────────

export const updatePaymentSchema = z.object({
    status: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
    transactionId: z.string().optional(),
});

export type UpdatePaymentDTO = z.infer<typeof updatePaymentSchema>;
