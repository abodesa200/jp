import { z } from "zod";

// ─────────────────────────────────────────────
// Get Notifications Query Schema
// ─────────────────────────────────────────────

export const getNotificationsQuerySchema = z.object({
    isRead: z
        .string()
        .optional()
        .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ─────────────────────────────────────────────
// Send Notification Schema (Admin)
// ─────────────────────────────────────────────

export const sendNotificationSchema = z.object({
    title: z.string().min(1).max(200),
    message: z.string().min(1).max(1000),
    userIds: z.array(z.number()).optional(), // If not provided, send to all users
    role: z.enum(["CLIENT", "DRIVER", "ADMIN", "CUSTOMER_SUPPORT"]).optional(), // Filter by role
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type GetNotificationsQueryDTO = z.infer<typeof getNotificationsQuerySchema>;
export type SendNotificationDTO = z.infer<typeof sendNotificationSchema>;
