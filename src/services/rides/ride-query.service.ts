import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import { GetNearbyRidesQueryDTO, GetRidesQueryDTO } from "./ride.schema";
import { calculateDistance } from "./ride.utils";

type Payload = {
    userId: number;
    role: string;
};

/**
 * Get user's rides with pagination and filtering
 */
export async function getUserRidesService(
    payload: Payload,
    query: GetRidesQueryDTO
) {
    const { status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { clientId: payload.userId };
    if (status) {
        where.status = status;
    }

    const [rides, total] = await Promise.all([
        prisma.ride.findMany({
            where,
            skip,
            take: limit,
            orderBy: { requestedAt: "desc" },
            include: {
                driver: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.ride.count({ where }),
    ]);

    return {
        rides,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get nearby available rides for drivers
 * Filters by distance and returns sorted by proximity
 */
export async function getNearbyRidesService(
    payload: Payload,
    query: GetNearbyRidesQueryDTO
) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can view nearby rides");
    }

    const driver = await prisma.driver.findUnique({
        where: { userId: payload.userId },
    });

    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    if (!driver.isApproved) {
        throw new ForbiddenError("Driver account is not approved yet");
    }

    if (!driver.latitude || !driver.longitude) {
        throw new BadRequestError(
            "Driver location not available. Please update your location."
        );
    }

    const { maxDistance, limit } = query;

    // جلب الرحلات المتاحة (REQUESTED فقط)
    const availableRides = await prisma.ride.findMany({
        where: {
            status: "REQUESTED",
            driverId: null,
        },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    avatarUrl: true,
                },
            },
            negotiation: {
                select: {
                    status: true,
                    clientOffer: true,
                    driverCounter: true,
                    agreedFare: true,
                },
            },
        },
        orderBy: { requestedAt: "desc" },
        take: 50,
    });

    // حساب المسافة وفلترة
    const ridesWithDistance = availableRides
        .map((ride) => {
            const distance = calculateDistance(
                driver.latitude!,
                driver.longitude!,
                ride.pickupLat,
                ride.pickupLng
            );

            return {
                ...ride,
                distanceFromDriver: parseFloat(distance.toFixed(2)),
            };
        })
        .filter((ride) => ride.distanceFromDriver <= maxDistance)
        .sort((a, b) => a.distanceFromDriver - b.distanceFromDriver)
        .slice(0, limit);

    return {
        rides: ridesWithDistance,
        driverLocation: {
            lat: driver.latitude,
            lng: driver.longitude,
        },
        filters: {
            maxDistance,
            limit,
        },
    };
}

/**
 * Get detailed information about a specific ride
 * Includes client, driver, negotiation, passengers, payment, and review
 */
export async function getRideDetailsService(payload: Payload, rideId: string) {
  const ride = await prisma.ride.findUnique({
    where: { id: Number(rideId) },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
          avatarUrl: true,
        },
      },
      driver: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
      },
      negotiation: {
        include: {
          history: {
            orderBy: { createdAt: "asc" },
          },
        },
      },
      passengers: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
      },
      payment: true,
      review: true,
    },
  });

  if (!ride) {
    throw new NotFoundError("Ride not found");
  }

  const isClient = ride.clientId === payload.userId;
  const isAdmin = payload.role === "ADMIN";
  const isDriver = payload.role === "DRIVER";

  // -------------------------
  // CLIENT + ADMIN
  // -------------------------
  if (isClient || isAdmin) {
    return { ride };
  }

  // -------------------------
  // DRIVER LOGIC
  // -------------------------
  if (isDriver) {
    const canAccess =
      ride.status === "REQUESTED" ||
      ride.driver?.userId === payload.userId;

    if (!canAccess) {
      throw new ForbiddenError("You don't have access to this ride");
    }

    return { ride };
  }

  // -------------------------
  // FALLBACK
  // -------------------------
  throw new ForbiddenError("You don't have access to this ride");
}