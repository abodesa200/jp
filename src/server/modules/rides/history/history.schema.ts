import { z } from "zod";

export const rideHistoryQuerySchema = z.object({
    status: z
        .enum([
            "REQUESTED",
            "ACCEPTED",
            "DRIVER_ARRIVED",
            "IN_PROGRESS",
            "COMPLETED",
            "CANCELLED",
        ])
        .optional(),
    type: z.enum(["STANDARD", "CARPOOLING"]).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type RideHistoryQueryDTO = z.infer<typeof rideHistoryQuerySchema>;
