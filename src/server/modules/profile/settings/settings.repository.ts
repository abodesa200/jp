import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// Settings Repository
// ─────────────────────────────────────────────

export const settingsRepository = {
    /**
     * البحث عن إعدادات المستخدم
     */
    findByUser(userId: number) {
        return prisma.userSettings.findUnique({
            where: { userId },
        });
    },

    /**
     * إنشاء إعدادات افتراضية
     */
    create(userId: number) {
        return prisma.userSettings.create({
            data: {
                userId,
                language: "ar",
                notifyRideUpdates: true,
                notifyPromotions: true,
                notifySystemMessages: true,
            },
        });
    },

    /**
     * تحديث إعدادات المستخدم
     */
    update(
        userId: number,
        data: {
            language?: string;
            notifyRideUpdates?: boolean;
            notifyPromotions?: boolean;
            notifySystemMessages?: boolean;
        }
    ) {
        return prisma.userSettings.update({
            where: { userId },
            data,
        });
    },

    /**
     * upsert: إنشاء أو تحديث
     */
    upsert(
        userId: number,
        updateData: {
            language?: string;
            notifyRideUpdates?: boolean;
            notifyPromotions?: boolean;
            notifySystemMessages?: boolean;
        },
        createData: {
            language: string;
            notifyRideUpdates: boolean;
            notifyPromotions: boolean;
            notifySystemMessages: boolean;
        }
    ) {
        return prisma.userSettings.upsert({
            where: { userId },
            update: updateData,
            create: {
                userId,
                ...createData,
            },
        });
    },
};
