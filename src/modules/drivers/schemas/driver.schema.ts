import { z } from "zod";

export const driverFilterSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
    approved: z.boolean().optional(),
    search: z.string().optional(),
});

export const updateDriverSchema = z.object({
    isApproved: z.boolean().optional(),
    isOnline: z.boolean().optional(),
});

export type DriverFilterInput = z.infer<typeof driverFilterSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
