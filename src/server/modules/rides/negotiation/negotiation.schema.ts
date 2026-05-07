import { z } from "zod";

// ─────────────────────────────────────────────
// Negotiate Ride Schema
// ─────────────────────────────────────────────

export const negotiateRideSchema = z.object({
    amount: z.number().positive(),
    message: z.string().max(500).optional(),
});

// ─────────────────────────────────────────────
// Respond to Negotiation Schema
// ─────────────────────────────────────────────

export const respondToNegotiationSchema = z.object({
    action: z.enum(["accept", "reject"]),
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type NegotiateRideDTO = z.infer<typeof negotiateRideSchema>;
export type RespondToNegotiationDTO = z.infer<typeof respondToNegotiationSchema>;
