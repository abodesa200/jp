import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// Favorites Repository
// ─────────────────────────────────────────────

export const favoritesRepository = {
    /**
     * جلب جميع المواقع المفضلة للمستخدم
     */
    findAllByUser(userId: number) {
        return prisma.favoriteLocation.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    },

    /**
     * عد المواقع المفضلة للمستخدم
     */
    countByUser(userId: number) {
        return prisma.favoriteLocation.count({
            where: { userId },
        });
    },

    /**
     * البحث عن موقع مفضل بالـ id
     */
    findById(id: number) {
        return prisma.favoriteLocation.findUnique({
            where: { id },
        });
    },

    /**
     * إضافة موقع مفضل جديد
     */
    create(data: {
        userId: number;
        name: string;
        address?: string;
        latitude: number;
        longitude: number;
    }) {
        return prisma.favoriteLocation.create({
            data,
        });
    },

    /**
     * حذف موقع مفضل
     */
    delete(id: number) {
        return prisma.favoriteLocation.delete({
            where: { id },
        });
    },
};
