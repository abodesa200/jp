import { prisma } from "@/lib/prisma";
import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { reviewsRepository } from "./reviews.repository";
import { CreateReviewDTO, GetReviewsQueryDTO } from "./reviews.schema";

type JWTPayload = {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
};

// ─────────────────────────────────────────────
// Create Review for Ride
// ─────────────────────────────────────────────

export async function createReviewService(
    payload: JWTPayload,
    rideId: number,
    data: CreateReviewDTO
) {
    // Get ride details
    const ride = await reviewsRepository.findRideWithReview(rideId);

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    // Validate ride is completed
    if (ride.status !== "COMPLETED") {
        throw new ForbiddenError("Can only review completed rides");
    }

    // Validate user is the client of this ride
    if (ride.clientId !== payload.userId) {
        throw new ForbiddenError("Only the ride client can leave a review");
    }

    // Check if review already exists
    if (ride.review) {
        throw new ConflictError("Review already exists for this ride");
    }

    // Validate driver exists
    if (!ride.driverId) {
        throw new ForbiddenError("Cannot review ride without a driver");
    }

    // Create review and update driver rating in a transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create review
        const review = await reviewsRepository.create({
            rideId,
            clientId: payload.userId,
            driverId: ride.driverId!,
            rating: data.rating,
            comment: data.comment,
        });

        // Recalculate driver rating
        const reviews = await reviewsRepository.findAllByDriver(ride.driverId!);

        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / reviews.length;

        // Update driver rating and total rides
        await reviewsRepository.updateDriverRating(
            ride.driverId!,
            Math.round(averageRating * 10) / 10, // Round to 1 decimal
            reviews.length
        );

        return review;
    });

    return result;
}

// ─────────────────────────────────────────────
// Get Review for Ride
// ─────────────────────────────────────────────

export async function getRideReviewService(
    payload: JWTPayload,
    rideId: number
) {
    const ride = await reviewsRepository.findRideForAccess(rideId);

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    // User must be client or driver of the ride
    if (ride.clientId !== payload.userId && ride.driverId !== payload.userId) {
        throw new ForbiddenError("You can only view reviews for your own rides");
    }

    const review = await reviewsRepository.findByRideId(rideId);

    if (!review) {
        throw new NotFoundError("Review not found for this ride");
    }

    return review;
}

// ─────────────────────────────────────────────
// Get Reviews for Driver
// ─────────────────────────────────────────────

export async function getDriverReviewsService(
    driverId: number,
    query: GetReviewsQueryDTO
) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    // Check if driver exists
    const driver = await reviewsRepository.findDriver(driverId);

    if (!driver) {
        throw new NotFoundError("Driver not found");
    }

    const [reviews, total] = await Promise.all([
        reviewsRepository.findDriverReviews(driverId, skip, limit),
        reviewsRepository.countDriverReviews(driverId),
    ]);

    return {
        reviews,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
        averageRating: driver.rating,
        totalReviews: driver.totalRides,
    };
}

// ─────────────────────────────────────────────
// Get My Reviews (as client or driver)
// ─────────────────────────────────────────────

export async function getMyReviewsService(
    payload: JWTPayload,
    query: GetReviewsQueryDTO
) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    let where: any = {};

    if (payload.role === "DRIVER") {
        // Get reviews I received as a driver
        const driver = await reviewsRepository.findDriverByUserId(payload.userId);

        if (!driver) {
            throw new NotFoundError("Driver profile not found");
        }

        where = { driverId: driver.id };
    } else {
        // Get reviews I wrote as a client
        where = { clientId: payload.userId };
    }

    const [reviews, total] = await Promise.all([
        reviewsRepository.findMyReviews(where, skip, limit),
        reviewsRepository.countMyReviews(where),
    ]);

    return {
        reviews,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    };
}
