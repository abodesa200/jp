import { z } from "zod";

// ─────────────────────────────────────────────
// Get Drivers Query
// ─────────────────────────────────────────────

export const getDriversQuerySchema = z.object({
    isApproved: z
        .enum(["true", "false", "all"])
        .optional()
        .default("all")
        .transform((val) => {
            if (val === "all") return undefined;
            return val === "true";
        }),
    isOnline: z
        .enum(["true", "false", "all"])
        .optional()
        .default("all")
        .transform((val) => {
            if (val === "all") return undefined;
            return val === "true";
        }),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    search: z.string().optional(),
});

export type GetDriversQueryDTO = z.infer<typeof getDriversQuerySchema>;

// ─────────────────────────────────────────────
// Update Driver (Approve/Reject)
// ─────────────────────────────────────────────

export const updateDriverSchema = z.object({
    isApproved: z.boolean().optional(),
    licenseNumber: z.string().min(5).optional(),
    carModel: z.string().min(2).optional(),
    carPlate: z.string().min(2).optional(),
    carColor: z.string().optional(),
    carYear: z.number().int().min(1990).max(2030).optional(),
});

export type UpdateDriverDTO = z.infer<typeof updateDriverSchema>;
