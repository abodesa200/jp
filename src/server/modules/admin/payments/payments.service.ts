import {
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { paymentsRepository } from "./payments.repository";
import { GetPaymentsQueryDTO, UpdatePaymentDTO } from "./payments.schema";

type JWTPayload = {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
};

// ─────────────────────────────────────────────
// Get Payments
// ─────────────────────────────────────────────

export async function getPaymentsService(
    payload: JWTPayload,
    query: GetPaymentsQueryDTO
) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const { payments, total } = await paymentsRepository.getPayments(query);

    return {
        payments,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

// ─────────────────────────────────────────────
// Get Payment by ID
// ─────────────────────────────────────────────

export async function getPaymentByIdService(
    payload: JWTPayload,
    paymentId: number
) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const payment = await paymentsRepository.getPaymentById(paymentId);

    if (!payment) {
        throw new NotFoundError("Payment not found");
    }

    return { payment };
}

// ─────────────────────────────────────────────
// Update Payment
// ─────────────────────────────────────────────

export async function updatePaymentService(
    payload: JWTPayload,
    paymentId: number,
    data: UpdatePaymentDTO
) {
    if (payload.role !== "ADMIN") {
        throw new ForbiddenError("Admin access required");
    }

    const payment = await paymentsRepository.getPaymentById(paymentId);

    if (!payment) {
        throw new NotFoundError("Payment not found");
    }

    const updatedPayment = await paymentsRepository.updatePayment(
        paymentId,
        data
    );

    return {
        payment: updatedPayment,
        message: "Payment updated successfully",
    };
}

// ─────────────────────────────────────────────
// Get Payment Stats
// ─────────────────────────────────────────────

export async function getPaymentStatsService(payload: JWTPayload) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const stats = await paymentsRepository.getPaymentStats();

    return { stats };
}
