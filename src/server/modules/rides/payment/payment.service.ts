import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import * as paymentRepository from "./payment.repository";
import {
    CreatePaymentDTO,
    GetPaymentsQueryDTO,
    UpdatePaymentDTO,
} from "./payment.schema";

type Payload = {
    userId: number;
    role: string;
};

// ─────────────────────────────────────────────
// Create Payment for Ride
// ─────────────────────────────────────────────

export async function createPaymentService(
    payload: Payload,
    rideId: number,
    data: CreatePaymentDTO
) {
    // Get ride details
    const ride = await paymentRepository.findRideWithPayment(rideId);

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    // Validate ride is completed
    if (ride.status !== "COMPLETED") {
        throw new ForbiddenError("Can only create payment for completed rides");
    }

    // Validate user is the client of this ride
    if (ride.clientId !== payload.userId) {
        throw new ForbiddenError("Only the ride client can create payment");
    }

    // Check if payment already exists
    if (ride.payment) {
        throw new ConflictError("Payment already exists for this ride");
    }

    // Create payment
    const payment = await paymentRepository.createPayment(rideId, data);

    return payment;
}

// ─────────────────────────────────────────────
// Get Payment for Ride
// ─────────────────────────────────────────────

export async function getRidePaymentService(payload: Payload, rideId: number) {
    const ride = await paymentRepository.findRideBasicInfo(rideId);

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    // User must be client or driver of the ride (or admin)
    if (
        payload.role !== "ADMIN" &&
        ride.clientId !== payload.userId &&
        ride.driverId !== payload.userId
    ) {
        throw new ForbiddenError(
            "You can only view payments for your own rides"
        );
    }

    const payment = await paymentRepository.getRidePayment(rideId);

    if (!payment) {
        throw new NotFoundError("Payment not found for this ride");
    }

    return payment;
}

// ─────────────────────────────────────────────
// Update Payment Status
// ─────────────────────────────────────────────

export async function updatePaymentService(
    payload: Payload,
    rideId: number,
    data: UpdatePaymentDTO
) {
    const ride = await paymentRepository.findRideWithPayment(rideId);

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    if (!ride.payment) {
        throw new NotFoundError("Payment not found for this ride");
    }

    // Only client or driver can update payment
    if (ride.clientId !== payload.userId && ride.driverId !== payload.userId) {
        throw new ForbiddenError(
            "You can only update payments for your own rides"
        );
    }

    const payment = await paymentRepository.updatePayment(rideId, data);

    return payment;
}

// ─────────────────────────────────────────────
// Get My Payments
// ─────────────────────────────────────────────

export async function getMyPaymentsService(
    payload: Payload,
    query: GetPaymentsQueryDTO
) {
    const { payments, total } = await paymentRepository.getMyPayments(
        payload.userId,
        payload.role,
        query
    );

    return {
        payments,
        pagination: {
            total,
            page: query.page,
            limit: query.limit,
            pages: Math.ceil(total / query.limit),
        },
    };
}

// ─────────────────────────────────────────────
// Get All Payments (Admin)
// ─────────────────────────────────────────────

export async function getAllPaymentsService(query: GetPaymentsQueryDTO) {
    const { payments, total } = await paymentRepository.getAllPayments(query);

    return {
        payments,
        pagination: {
            total,
            page: query.page,
            limit: query.limit,
            pages: Math.ceil(total / query.limit),
        },
    };
}
