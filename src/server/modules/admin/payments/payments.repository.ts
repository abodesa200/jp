import { prisma } from "@/lib/prisma";
import { GetPaymentsQueryDTO, UpdatePaymentDTO } from "./payments.schema";

// ─────────────────────────────────────────────
// Get Payments
// ─────────────────────────────────────────────

export async function getPayments(query: GetPaymentsQueryDTO) {
    const skip = (query.page - 1) * query.limit;

    const where: any = {};

    // Filter by status
    if (query.status !== "all") {
        where.status = query.status;
    }

    // Filter by method
    if (query.method !== "all") {
        where.method = query.method;
    }

    // Date range filter
    if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate) {
            where.createdAt.gte = new Date(query.startDate);
        }
        if (query.endDate) {
            where.createdAt.lte = new Date(query.endDate);
        }
    }

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            where,
            skip,
            take: query.limit,
            orderBy: { createdAt: "desc" },
            include: {
                ride: {
                    include: {
                        client: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                            },
                        },
                        driver: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        phone: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }),
        prisma.payment.count({ where }),
    ]);

    return { payments, total };
}

// ─────────────────────────────────────────────
// Get Payment by ID
// ─────────────────────────────────────────────

export async function getPaymentById(paymentId: number) {
    return prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
            ride: {
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                    driver: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    phone: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
}

// ─────────────────────────────────────────────
// Update Payment
// ─────────────────────────────────────────────

export async function updatePayment(
    paymentId: number,
    data: UpdatePaymentDTO
) {
    return prisma.payment.update({
        where: { id: paymentId },
        data,
        include: {
            ride: {
                include: {
                    client: true,
                    driver: {
                        include: {
                            user: true,
                        },
                    },
                },
            },
        },
    });
}

// ─────────────────────────────────────────────
// Get Payment Stats
// ─────────────────────────────────────────────

export async function getPaymentStats() {
    const [total, pending, paid, failed, refunded, totalRevenue] =
        await Promise.all([
            prisma.payment.count(),
            prisma.payment.count({ where: { status: "PENDING" } }),
            prisma.payment.count({ where: { status: "PAID" } }),
            prisma.payment.count({ where: { status: "FAILED" } }),
            prisma.payment.count({ where: { status: "REFUNDED" } }),
            prisma.payment.aggregate({
                where: { status: "PAID" },
                _sum: { amount: true },
            }),
        ]);

    return {
        total,
        pending,
        paid,
        failed,
        refunded,
        totalRevenue: totalRevenue._sum.amount || 0,
    };
}

export const paymentsRepository = {
    getPayments,
    getPaymentById,
    updatePayment,
    getPaymentStats,
};
