import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// Driver Repository
// ─────────────────────────────────────────────

export const driverRepository = {
    /**
     * البحث عن driver بالـ ID
     */
    findDriverById(driverId: number) {
        return prisma.driver.findUnique({
            where: { id: driverId },
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
     * البحث عن driver بالـ userId
     */
    findDriverByUserId(userId: number) {
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
     * تحديث موقع السائق
     */
    updateDriverLocation(
        userId: number,
        data: {
            latitude: number;
            longitude: number;
        }
    ) {
        return prisma.driver.update({
            where: { userId },
            data: {
                latitude: data.latitude,
                longitude: data.longitude,
                lastLocationUpdate: new Date(),
            },
        });
    },

    /**
     * تحديث حالة السائق (online/offline)
     */
    updateDriverStatus(userId: number, isOnline: boolean) {
        return prisma.driver.update({
            where: { userId },
            data: { isOnline },
        });
    },

    /**
     * البحث عن السائقين القريبين
     * Note: هذا implementation بسيط. للـ production استخدم PostGIS أو خدمة خارجية
     */
    async findNearbyDrivers(
        latitude: number,
        longitude: number,
        radiusKm: number
    ) {
        // جلب كل السائقين المتاحين
        const drivers = await prisma.driver.findMany({
            where: {
                isOnline: true,
                isApproved: true,
                latitude: { not: null },
                longitude: { not: null },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        // حساب المسافة وفلترة السائقين
        const nearbyDrivers = drivers
            .map((driver) => {
                if (!driver.latitude || !driver.longitude) return null;

                const distance = calculateDistance(
                    latitude,
                    longitude,
                    driver.latitude,
                    driver.longitude
                );

                if (distance <= radiusKm) {
                    return {
                        ...driver,
                        distance,
                    };
                }

                return null;
            })
            .filter((d) => d !== null)
            .sort((a, b) => a!.distance - b!.distance);

        return nearbyDrivers;
    },

    /**
     * جلب إحصائيات السائق
     */
    async getDriverStats(driverId: number) {
        const [driver, completedRides, totalEarnings] = await Promise.all([
            prisma.driver.findUnique({
                where: { id: driverId },
                select: {
                    rating: true,
                    totalRides: true,
                },
            }),
            prisma.ride.count({
                where: {
                    driverId,
                    status: "COMPLETED",
                },
            }),
            prisma.payment.aggregate({
                where: {
                    ride: {
                        driverId,
                        status: "COMPLETED",
                    },
                    status: "PAID",
                },
                _sum: {
                    amount: true,
                },
            }),
        ]);

        return {
            rating: driver?.rating || 0,
            totalRides: driver?.totalRides || 0,
            completedRides,
            totalEarnings: totalEarnings._sum.amount || 0,
        };
    },

    /**
     * جلب تقييمات السائق
     */
    async getDriverReviews(
        driverId: number,
        page: number = 1,
        limit: number = 10
    ) {
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: { driverId },
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
                            pickupAddress: true,
                            dropoffAddress: true,
                            completedAt: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.review.count({
                where: { driverId },
            }),
        ]);

        return {
            reviews,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    /**
     * جلب رحلات السائق
     */
    async getDriverRides(
        driverId: number,
        status?: string,
        page: number = 1,
        limit: number = 10
    ) {
        const skip = (page - 1) * limit;

        const where: any = { driverId };
        if (status) {
            where.status = status;
        }

        const [rides, total] = await Promise.all([
            prisma.ride.findMany({
                where,
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            avatarUrl: true,
                        },
                    },
                    payment: {
                        select: {
                            amount: true,
                            method: true,
                            status: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.ride.count({ where }),
        ]);

        return {
            rides,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },
};

// ─────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────

/**
 * حساب المسافة بين نقطتين باستخدام Haversine formula
 * @returns المسافة بالكيلومتر
 */
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}
