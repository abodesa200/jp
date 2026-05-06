import { ConflictError, ForbiddenError, NotFoundError } from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import { CreateReviewDTO, GetReviewsQueryDTO } from "./review.schema";

type Payload = {
    userId: number;
    role: string;
};

// ─────────────────────────────────────────────
// Create Review for Ride
// ─────────────────────────────────────────────

export async function createReviewService(
    payload: Payload,
    rideId: number,
    data: CreateReviewDTO
) {
    // Get ride details
    const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: {
            review: true,
        },
    });

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
        const review = await tx.review.create({
            data: {
                rideId,
                clientId: payload.userId,
                driverId: ride.driverId!,
                rating: data.rating,
                comment: data.comment,
            },
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

        // Recalculate driver rating
        const reviews = await tx.review.findMany({
            where: { driverId: ride.driverId! },
            select: { rating: true },
        });

        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / reviews.length;

        // Update driver rating and total rides
        await tx.driver.update({
            where: { id: ride.driverId! },
            data: {
                rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
                totalRides: reviews.length,
            },
        });

        return review;
    });

    return result;
}

// ─────────────────────────────────────────────
// Get Review for Ride
// ─────────────────────────────────────────────

export async function getRideReviewService(payload: Payload, rideId: number) {
    const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        select: {
            id: true,
            clientId: true,
            driverId: true,
        },
    });

    if (!ride) {
        throw new NotFoundError("Ride not found");
    }

    // User must be client or driver of the ride
    if (ride.clientId !== payload.userId && ride.driverId !== payload.userId) {
        throw new ForbiddenError("You can only view reviews for your own rides");
    }

    const review = await prisma.review.findUnique({
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

    if (!review) {
        throw new NotFoundError("Review not found for this ride");
    }

    return review;
}

// ─────────────────────────────────────────────
// Get Reviews for Driver
// ─────────────────────────────────────────────

export async function getDriverReviewsService(driverId: number, query: GetReviewsQueryDTO) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    // Check if driver exists
    const driver = await prisma.driver.findUnique({
        where: { id: driverId },
    });

    if (!driver) {
        throw new NotFoundError("Driver not found");
    }

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where: { driverId },
            skip,
            take: limit,
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
        }),
        prisma.review.count({ where: { driverId } }),
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

export async function getMyReviewsService(payload: Payload, query: GetReviewsQueryDTO) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    let where: any = {};

    if (payload.role === "DRIVER") {
        // Get reviews I received as a driver
        const driver = await prisma.driver.findUnique({
            where: { userId: payload.userId },
        });

        if (!driver) {
            throw new NotFoundError("Driver profile not found");
        }

        where = { driverId: driver.id };
    } else {
        // Get reviews I wrote as a client
        where = { clientId: payload.userId };
    }

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where,
            skip,
            take: limit,
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
        }),
        prisma.review.count({ where }),
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
