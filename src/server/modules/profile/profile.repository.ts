import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// Profile Repository
// ─────────────────────────────────────────────

export const profileRepository = {
    /**
     * البحث عن client profile
     */
    findClientProfile(userId: number) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
                role: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    },

    /**
     * البحث عن driver profile
     */
    findDriverProfile(userId: number) {
        return prisma.driver.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                        role: true,
                        isVerified: true,
                    },
                },
            },
        });
    },

    /**
     * تحديث client profile
     */
    updateClientProfile(
        userId: number,
        data: {
            name?: string;
            email?: string;
            phone?: string;
            avatarUrl?: string;
        }
    ) {
        return prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
                role: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    },

    /**
     * تحديث driver profile (user data)
     */
    updateDriverUser(
        userId: number,
        data: {
            name?: string;
            email?: string;
            phone?: string;
            avatarUrl?: string;
        }
    ) {
        return prisma.user.update({
            where: { id: userId },
            data,
        });
    },

    /**
     * تحديث driver profile (driver data)
     */
    updateDriverData(
        userId: number,
        data: {
            licenseNumber?: string;
            carModel?: string;
            carPlate?: string;
            carColor?: string;
            carYear?: number;
            isOnline?: boolean;
            latitude?: number;
            longitude?: number;
            lastLocationUpdate?: Date;
        }
    ) {
        return prisma.driver.update({
            where: { userId },
            data,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatarUrl: true,
                        role: true,
                        isVerified: true,
                    },
                },
            },
        });
    },

    /**
     * التحقق من وجود email
     */
    findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });
    },

    /**
     * التحقق من وجود phone
     */
    findByPhone(phone: string) {
        return prisma.user.findUnique({
            where: { phone },
            select: { id: true },
        });
    },
};
