import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// Notification Repository
// ─────────────────────────────────────────────

export const notificationRepository = {
    /**
     * جلب جميع الإشعارات للمستخدم
     */
    findAllByUserId(userId: number, limit = 50, offset = 0) {
        return prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
        });
    },

    /**
     * جلب الإشعارات غير المقروءة فقط
     */
    findUnreadByUserId(userId: number) {
        return prisma.notification.findMany({
            where: {
                userId,
                isRead: false,
            },
            orderBy: { createdAt: "desc" },
        });
    },

    /**
     * عدد الإشعارات غير المقروءة
     */
    countUnreadByUserId(userId: number) {
        return prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    },

    /**
     * جلب إشعار واحد
     */
    findById(id: number) {
        return prisma.notification.findUnique({
            where: { id },
        });
    },

    /**
     * إنشاء إشعار جديد
     */
    create(data: { userId: number; title: string; message: string }) {
        return prisma.notification.create({
            data,
        });
    },

    /**
     * إنشاء إشعارات متعددة (bulk)
     */
    createMany(
        notifications: Array<{ userId: number; title: string; message: string }>
    ) {
        return prisma.notification.createMany({
            data: notifications,
        });
    },

    /**
     * تحديث حالة إشعار إلى مقروء
     */
    markAsRead(id: number) {
        return prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    },

    /**
     * تحديث جميع إشعارات المستخدم إلى مقروءة
     */
    markAllAsRead(userId: number) {
        return prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: { isRead: true },
        });
    },

    /**
     * حذف إشعار
     */
    delete(id: number) {
        return prisma.notification.delete({
            where: { id },
        });
    },

    /**
     * حذف جميع إشعارات المستخدم
     */
    deleteAllByUserId(userId: number) {
        return prisma.notification.deleteMany({
            where: { userId },
        });
    },

    /**
     * حذف الإشعارات القديمة (أكثر من X يوم)
     */
    deleteOlderThan(days: number) {
        const date = new Date();
        date.setDate(date.getDate() - days);

        return prisma.notification.deleteMany({
            where: {
                createdAt: {
                    lt: date,
                },
            },
        });
    },
};
