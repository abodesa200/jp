import { z } from "zod";

// ─────────────────────────────────────────────
// Create Support Ticket
// ─────────────────────────────────────────────

export const createSupportTicketSchema = z.object({
    subject: z
        .string()
        .min(5, "Subject must be at least 5 characters")
        .max(200, "Subject must be less than 200 characters"),
    message: z
        .string()
        .min(10, "Message must be at least 10 characters")
        .max(2000, "Message must be less than 2000 characters"),
});

export type CreateSupportTicketDTO = z.infer<
    typeof createSupportTicketSchema
>;

// ─────────────────────────────────────────────
// Update Support Ticket (Admin/Support)
// ─────────────────────────────────────────────

export const updateSupportTicketSchema = z.object({
    isResolved: z.boolean().optional(),
});

export type UpdateSupportTicketDTO = z.infer<
    typeof updateSupportTicketSchema
>;

// ─────────────────────────────────────────────
// Query Params
// ─────────────────────────────────────────────

export const getSupportTicketsQuerySchema = z.object({
    status: z.enum(["all", "open", "resolved"]).optional().default("all"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type GetSupportTicketsQuery = z.infer<
    typeof getSupportTicketsQuerySchema
>;
