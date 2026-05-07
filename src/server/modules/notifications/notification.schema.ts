import { z } from "zod";

// ─────────────────────────────────────────────
// Create Notification Schema
// ─────────────────────────────────────────────

export const createNotificationSchema = z.object({
    userId: z.number().int().positive(),
    title: z.string().min(1).max(100),
    message: z.string().min(1).max(500),
});

// ─────────────────────────────────────────────
// Create Bulk Notifications Schema
// ─────────────────────────────────────────────

export const createBulkNotificationsSchema = z.object({
    userIds: z.array(z.number().int().positive()).min(1),
    title: z.string().min(1).max(100),
    message: z.string().min(1).max(500),
});

// ─────────────────────────────────────────────
// Mark as Read Schema
// ─────────────────────────────────────────────

export const markAsReadSchema = z.object({
    notificationId: z.number().int().positive(),
});

// ─────────────────────────────────────────────
// Query Params Schema
// ─────────────────────────────────────────────

export const getNotificationsQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
    unreadOnly: z
        .string()
        .optional()
        .transform((val) => val === "true"),
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type CreateNotificationDTO = z.infer<typeof createNotificationSchema>;
export type CreateBulkNotificationsDTO = z.infer<
    typeof createBulkNotificationsSchema
>;
export type MarkAsReadDTO = z.infer<typeof markAsReadSchema>;
export type GetNotificationsQueryDTO = z.infer<
    typeof getNotificationsQuerySchema
>;
