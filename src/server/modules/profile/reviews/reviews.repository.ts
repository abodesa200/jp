import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// Reviews Repository
// ─────────────────────────────────────────────

export const reviewsRepository = {
    /**
     * البحث عن ride مع review
     */
    findRideWithReview(rideId: number) {
        return prisma.ride.findUnique({
            where: { id: rideId },
            include: {
                review: true,
            },
        });
    },

    /**
     * إنشاء review جديد
     */
    create(data: {
        rideId: number;
        clientId: number;
        driverId: number;
        rating: number;
        comment?: string;
    }) {
        return prisma.review.create({
            data,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    },

    /**
     * جلب جميع reviews للـ driver
     */
    findAllByDriver(driverId: number) {
        return prisma.review.findMany({
            where: { driverId },
            select: { rating: true },
        });
    },

    /**
     * تحديث driver rating
     */
    updateDriverRating(driverId: number, rating: number, totalRides: number) {
        return prisma.driver.update({
            where: { id: driverId },
            data: {
                rating,
                totalRides,
            },
        });
    },

    /**
     * جلب review بالـ rideId
     */
    findByRideId(rideId: number) {
        return prisma.review.findUnique({
            where: { rideId },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                driver: {
                    select: {
                        id: true,
                        userId: true,
                        carModel: true,
                        rating: true,
                    },
                },
            },
        });
    },

    /**
     * جلب reviews للـ driver مع pagination
     */
    findDriverReviews(driverId: number, skip: number, take: number) {
        return prisma.review.findMany({
            where: { driverId },
            skip,
            take,
            orderBy: { createdAt: "desc" },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                ride: {
                    select: {
                        id: true,
                        completedAt: true,
                    },
                },
            },
        });
    },

    /**
     * عد reviews للـ driver
     */
    countDriverReviews(driverId: number) {
        return prisma.review.count({ where: { driverId } });
    },

    /**
     * جلب reviews للمستخدم (كـ client أو driver)
     */
    findMyReviews(where: any, skip: number, take: number) {
        return prisma.review.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                driver: {
                    select: {
                        id: true,
                        userId: true,
                        carModel: true,
                        rating: true,
                    },
                },
                ride: {
                    select: {
                        id: true,
                        completedAt: true,
                        pickupAddress: true,
                        dropoffAddress: true,
                    },
                },
            },
        });
    },

    /**
     * عد reviews للمستخدم
     */
    countMyReviews(where: any) {
        return prisma.review.count({ where });
    },

    /**
     * البحث عن driver
     */
    findDriver(driverId: number) {
        return prisma.driver.findUnique({
            where: { id: driverId },
        });
    },

    /**
     * البحث عن driver بالـ userId
     */
    findDriverByUserId(userId: number) {
        return prisma.driver.findUnique({
            where: { userId },
        });
    },

    /**
     * البحث عن ride للتحقق من الصلاحيات
     */
    findRideForAccess(rideId: number) {
        return prisma.ride.findUnique({
            where: { id: rideId },
            select: {
                id: true,
                clientId: true,
                driverId: true,
            },
        });
    },
};
