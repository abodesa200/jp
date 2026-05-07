import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// User Repository
// ─────────────────────────────────────────────

export const userRepository = {
    /**
     * البحث عن user بالـ email مع بيانات driver
     */
    findByEmailWithDriver(email: string) {
        return prisma.user.findUnique({
            where: { email },
            include: { driver: true },
        });
    },

    /**
     * البحث عن user بالـ email
     */
    findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
        });
    },

    /**
     * البحث عن user بالـ id
     */
    findById(id: number) {
        return prisma.user.findUnique({
            where: { id },
            include: { driver: true },
        });
    },

    /**
     * إنشاء client جديد
     */
    createClient(email: string) {
        return prisma.user.create({
            data: {
                email,
                role: "CLIENT",
            },
            include: { driver: true },
        });
    },

    /**
     * إنشاء driver جديد (يحتاج موافقة admin)
     */
    createDriver(
        email: string,
        driverData: {
            licenseNumber: string;
            carModel: string;
            carPlate: string;
            carColor?: string;
            carYear?: number;
        }
    ) {
        return prisma.user.create({
            data: {
                email,
                role: "DRIVER",
                driver: {
                    create: {
                        ...driverData,
                        isApproved: false,
                    },
                },
            },
            include: { driver: true },
        });
    },

    /**
     * تحديث بيانات user
     */
    update(
        id: number,
        data: {
            name?: string;
            phone?: string;
            isVerified?: boolean;
            avatarUrl?: string;
        }
    ) {
        return prisma.user.update({
            where: { id },
            data,
        });
    },
};
