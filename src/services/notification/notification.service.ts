import { ForbiddenError, NotFoundError } from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import { emitSocketEvent } from "@/lib/socket/emit";
import { GetNotificationsQueryDTO, SendNotificationDTO } from "./notification.schema";

type Payload = {
    userId: number;
    role: string;
};

// ─────────────────────────────────────────────
// Get My Notifications
// ─────────────────────────────────────────────

export async function getMyNotificationsService(payload: Payload, query: GetNotificationsQueryDTO) {
    const { isRead, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {
        userId: payload.userId,
    };

    if (isRead !== undefined) {
        where.isRead = isRead;
    }

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
            where: {
                userId: payload.userId,
                isRead: false,
            },
        }),
    ]);

    return {
        notifications,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
        unreadCount,
    };
}

// ─────────────────────────────────────────────
// Mark Notification as Read
// ─────────────────────────────────────────────

export async function markNotificationAsReadService(payload: Payload, notificationId: number) {
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
    });

    if (!notification) {
        throw new NotFoundError("Notification not found");
    }

    // User can only mark their own notifications as read
    if (notification.userId !== payload.userId) {
        throw new ForbiddenError("You can only mark your own notifications as read");
    }

    const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
    });

    return updatedNotification;
}

// ─────────────────────────────────────────────
// Delete Notification
// ─────────────────────────────────────────────

export async function deleteNotificationService(payload: Payload, notificationId: number) {
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
    });

    if (!notification) {
        throw new NotFoundError("Notification not found");
    }

    // User can only delete their own notifications
    if (notification.userId !== payload.userId) {
        throw new ForbiddenError("You can only delete your own notifications");
    }

    await prisma.notification.delete({
        where: { id: notificationId },
    });

    return {
        success: true,
        message: "Notification deleted successfully",
    };
}

// ─────────────────────────────────────────────
// Send Notification (Admin)
// ─────────────────────────────────────────────

export async function sendNotificationService(data: SendNotificationDTO) {
    const { title, message, userIds, role } = data;

    let targetUserIds: number[] = [];

    if (userIds && userIds.length > 0) {
        // Send to specific users
        targetUserIds = userIds;
    } else if (role) {
        // Send to all users with specific role
        const users = await prisma.user.findMany({
            where: { role },
            select: { id: true },
        });
        targetUserIds = users.map((u) => u.id);
    } else {
        // Send to all users
        const users = await prisma.user.findMany({
            select: { id: true },
        });
        targetUserIds = users.map((u) => u.id);
    }

    // Create notifications for all target users
    await prisma.notification.createMany({
        data: targetUserIds.map((userId) => ({
            userId,
            title,
            message,
            isRead: false,
        })),
    });

    // Send real-time notifications via socket
    targetUserIds.forEach((userId) => {
        emitSocketEvent(`user:${userId}`, "notification:new", {
            title,
            message,
        });
    });

    return {
        success: true,
        sentTo: targetUserIds.length,
        message: `Notification sent to ${targetUserIds.length} users`,
    };
}

// ─────────────────────────────────────────────
// Helper: Create Notification for User
// ─────────────────────────────────────────────

export async function createNotificationForUser(
    userId: number,
    title: string,
    message: string
) {
    const notification = await prisma.notification.create({
        data: {
            userId,
            title,
            message,
            isRead: false,
        },
    });

    // Send real-time notification
    emitSocketEvent(`user:${userId}`, "notification:new", {
        id: notification.id,
        title,
        message,
        createdAt: notification.createdAt,
    });

    return notification;
}
