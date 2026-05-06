import { z } from "zod";

// ─────────────────────────────────────────────
// Statistics Query Schema
// ─────────────────────────────────────────────

export const statisticsQuerySchema = z.object({
    period: z.enum(["daily", "weekly", "monthly"]).default("daily"),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type StatisticsQueryDTO = z.infer<typeof statisticsQuerySchema>;
