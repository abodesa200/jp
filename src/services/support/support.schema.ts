import { z } from "zod";

// ─────────────────────────────────────────────
// Create Support Ticket Schema
// ─────────────────────────────────────────────

export const createSupportTicketSchema = z.object({
    subject: z.string().min(1).max(200),
    message: z.string().min(1).max(2000),
});

// ─────────────────────────────────────────────
// Update Support Ticket Schema
// ─────────────────────────────────────────────

export const updateSupportTicketSchema = z.object({
    message: z.string().min(1).max(2000).optional(),
    isResolved: z.boolean().optional(),
});

// ─────────────────────────────────────────────
// Get Support Tickets Query Schema
// ─────────────────────────────────────────────

export const getSupportTicketsQuerySchema = z.object({
    isResolved: z
        .string()
        .optional()
        .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type CreateSupportTicketDTO = z.infer<typeof createSupportTicketSchema>;
export type UpdateSupportTicketDTO = z.infer<typeof updateSupportTicketSchema>;
export type GetSupportTicketsQueryDTO = z.infer<typeof getSupportTicketsQuerySchema>;
