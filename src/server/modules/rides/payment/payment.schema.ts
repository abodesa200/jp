import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

// ─────────────────────────────────────────────
// Shared Enums
// ─────────────────────────────────────────────

export const paymentMethodEnum = z
    .enum(["CASH", "CARD", "WALLET"])
    .openapi({
        description: "Payment method. Allowed values: `CASH`, `CARD`, `WALLET`",
        example: "CASH",
    });

export const paymentStatusEnum = z
    .enum(["PENDING", "PAID", "FAILED", "REFUNDED"])
    .openapi({
        description: "Payment status. Allowed values: `PENDING`, `PAID`, `FAILED`, `REFUNDED`",
        example: "PAID",
    });

// ─────────────────────────────────────────────
// Create Payment Schema
// ─────────────────────────────────────────────

export const createPaymentSchema = z.object({
    method: paymentMethodEnum.default("CASH"),
    amount: z.number().positive().openapi({ example: 15.5 }),
});

// ─────────────────────────────────────────────
// Update Payment Schema
// ─────────────────────────────────────────────

export const updatePaymentSchema = z.object({
    status: paymentStatusEnum,
    transactionId: z.string().optional().openapi({ example: "txn_abc123" }),
});

// ─────────────────────────────────────────────
// Get Payments Query Schema
// ─────────────────────────────────────────────

export const getPaymentsQuerySchema = z.object({
    status: paymentStatusEnum.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ─────────────────────────────────────────────
// Response Schemas
// ─────────────────────────────────────────────

export const paymentItemSchema = z
    .object({
        id: z.string().openapi({ example: "clx1abc123" }),
        rideId: z.string().openapi({ example: "clx1ride456" }),
        amount: z.number().openapi({ example: 15.5 }),
        method: paymentMethodEnum,
        status: paymentStatusEnum,
        transactionId: z.string().nullable().openapi({ example: "txn_abc123" }),
        createdAt: z.string().datetime().openapi({ example: "2026-05-14T10:30:00.000Z" }),
    })
    .openapi("PaymentItem");

export const paginationSchema = z
    .object({
        total: z.number().int().openapi({ example: 42 }),
        page: z.number().int().openapi({ example: 1 }),
        limit: z.number().int().openapi({ example: 10 }),
        pages: z.number().int().openapi({ example: 5 }),
    })
    .openapi("Pagination");

export const getPaymentsResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        data: z.object({
            payments: z.array(paymentItemSchema),
            pagination: paginationSchema,
        }),
    })
    .openapi("GetPaymentsResponse");

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type CreatePaymentDTO = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentDTO = z.infer<typeof updatePaymentSchema>;
export type GetPaymentsQueryDTO = z.infer<typeof getPaymentsQuerySchema>;
