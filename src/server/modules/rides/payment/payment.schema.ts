import { z } from "zod";

// ─────────────────────────────────────────────
// Create Payment Schema
// ─────────────────────────────────────────────

export const createPaymentSchema = z.object({
    method: z.enum(["CASH", "CARD", "WALLET"]).default("CASH"),
    amount: z.number().positive(),
});

// ─────────────────────────────────────────────
// Update Payment Schema
// ─────────────────────────────────────────────

export const updatePaymentSchema = z.object({
    status: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]),
    transactionId: z.string().optional(),
});

// ─────────────────────────────────────────────
// Get Payments Query Schema
// ─────────────────────────────────────────────

export const getPaymentsQuerySchema = z.object({
    status: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type CreatePaymentDTO = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentDTO = z.infer<typeof updatePaymentSchema>;
export type GetPaymentsQueryDTO = z.infer<typeof getPaymentsQuerySchema>;
