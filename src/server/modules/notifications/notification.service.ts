import {
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { notificationRepository } from "./notification.repository";
import {
    CreateBulkNotificationsDTO,
    CreateNotificationDTO,
    GetNotificationsQueryDTO,
} from "./notification.schema";

type JWTPayload = {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
};

// ─────────────────────────────────────────────
// Get User Notifications
// ─────────────────────────────────────────────

export async function getUserNotificationsService(
    payload: JWTPayload,
    query: GetNotificationsQueryDTO
) {
    const { limit, offset, unreadOnly } = query;

    let notifications;

    if (unreadOnly) {
        notifications = await notificationRepository.findUnreadByUserId(
            payload.userId
        );
    } else {
        notifications = await notificationRepository.findAllByUserId(
            payload.userId,
            limit,
            offset
        );
    }

    const unreadCount = await notificationRepository.countUnreadByUserId(
        payload.userId
    );

    return {
        notifications,
        unreadCount,
        total: notifications.length,
    };
}

// ─────────────────────────────────────────────
// Get Unread Count
// ─────────────────────────────────────────────

export async function getUnreadCountService(payload: JWTPayload) {
    const count = await notificationRepository.countUnreadByUserId(
        payload.userId
    );

    return { unreadCount: count };
}

// ─────────────────────────────────────────────
// Mark Notification as Read
// ─────────────────────────────────────────────

export async function markNotificationAsReadService(
    payload: JWTPayload,
    notificationId: number
) {
    const notification = await notificationRepository.findById(notificationId);

    if (!notification) {
        throw new NotFoundError("Notification not found");
    }

    // التحقق من أن الإشعار يخص المستخدم
    if (notification.userId !== payload.userId) {
        throw new ForbiddenError(
            "You don't have permission to access this notification"
        );
    }

    const updated = await notificationRepository.markAsRead(notificationId);

    return { notification: updated };
}

// ─────────────────────────────────────────────
// Mark All Notifications as Read
// ─────────────────────────────────────────────

export async function markAllNotificationsAsReadService(payload: JWTPayload) {
    await notificationRepository.markAllAsRead(payload.userId);

    return { message: "All notifications marked as read" };
}

// ─────────────────────────────────────────────
// Delete Notification
// ─────────────────────────────────────────────

export async function deleteNotificationService(
    payload: JWTPayload,
    notificationId: number
) {
    const notification = await notificationRepository.findById(notificationId);

    if (!notification) {
        throw new NotFoundError("Notification not found");
    }

    // التحقق من أن الإشعار يخص المستخدم
    if (notification.userId !== payload.userId) {
        throw new ForbiddenError(
            "You don't have permission to delete this notification"
        );
    }

    await notificationRepository.delete(notificationId);

    return { message: "Notification deleted successfully" };
}

// ─────────────────────────────────────────────
// Delete All User Notifications
// ─────────────────────────────────────────────

export async function deleteAllNotificationsService(payload: JWTPayload) {
    await notificationRepository.deleteAllByUserId(payload.userId);

    return { message: "All notifications deleted successfully" };
}

// ─────────────────────────────────────────────
// Create Notification (Admin/System Only)
// ─────────────────────────────────────────────

export async function createNotificationService(
    payload: JWTPayload,
    data: CreateNotificationDTO
) {
    // فقط الأدمن أو النظام يقدر ينشئ إشعارات
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError(
            "Only admins can create notifications for other users"
        );
    }

    const notification = await notificationRepository.create(data);

    return { notification };
}

// ─────────────────────────────────────────────
// Create Bulk Notifications (Admin Only)
// ─────────────────────────────────────────────

export async function createBulkNotificationsService(
    payload: JWTPayload,
    data: CreateBulkNotificationsDTO
) {
    // فقط الأدمن يقدر يرسل إشعارات جماعية
    if (payload.role !== "ADMIN") {
        throw new ForbiddenError("Only admins can send bulk notifications");
    }

    const notifications = data.userIds.map((userId) => ({
        userId,
        title: data.title,
        message: data.message,
    }));

    await notificationRepository.createMany(notifications);

    return {
        message: `${notifications.length} notifications sent successfully`,
        count: notifications.length,
    };
}

// ─────────────────────────────────────────────
// Helper: Send Notification to User (Internal)
// ─────────────────────────────────────────────

/**
 * دالة مساعدة لإرسال إشعار لمستخدم معين
 * يمكن استخدامها من modules أخرى (مثل rides, payments, etc.)
 */
export async function sendNotificationToUser(
    userId: number,
    title: string,
    message: string
) {
    return notificationRepository.create({
        userId,
        title,
        message,
    });
}

// ─────────────────────────────────────────────
// Helper: Send Notification to Multiple Users (Internal)
// ─────────────────────────────────────────────

/**
 * دالة مساعدة لإرسال إشعار لعدة مستخدمين
 */
export async function sendNotificationToUsers(
    userIds: number[],
    title: string,
    message: string
) {
    const notifications = userIds.map((userId) => ({
        userId,
        title,
        message,
    }));

    return notificationRepository.createMany(notifications);
}
