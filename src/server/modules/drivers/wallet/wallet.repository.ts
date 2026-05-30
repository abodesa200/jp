import { prisma } from "@/lib/prisma";

export const walletRepository = {
    findWalletByDriverId(driverId: number) {
        return prisma.driverWallet.findUnique({
            where: { driverId },
            select: {
                id: true,
                balance: true,
                totalEarned: true,
                totalDeducted: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    },

    findOrCreateWallet(driverId: number) {
        return prisma.driverWallet.upsert({
            where: { driverId },
            create: {
                driverId,
                balance: 0,
                totalEarned: 0,
                totalDeducted: 0,
            },
            update: {},
            select: {
                id: true,
                balance: true,
                totalEarned: true,
                totalDeducted: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    },

    async getTransactions(
        walletId: number,
        page: number = 1,
        limit: number = 20
    ) {
        const skip = (page - 1) * limit;

        const [transactions, total] = await Promise.all([
            prisma.walletTransaction.findMany({
                where: { walletId },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.walletTransaction.count({ where: { walletId } }),
        ]);

        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },
};
