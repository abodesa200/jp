// rides.repository.ts
import { RideFlow, RideMode, ServiceType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { GetRidesQueryDTO } from "./rides.schema";

// ─────────────────────────────────────────────
// Create Ride
// ─────────────────────────────────────────────

export async function createRide(
  clientId: number,
  data: {
    pickupLat: number;
    pickupLng: number;
    pickupAddress?: string;
    dropoffLat: number;
    dropoffLng: number;
    dropoffAddress?: string;

    rideMode: RideMode;
    rideFlow: RideFlow;
    serviceType: ServiceType;

    maxPassengers: number;
    availableSeats: number;

    systemFare: number;
    finalFare: number;
    discountAmount: number;

    distance: number;
    duration: number;

    clientOffer?: number;
  }
) {
  return prisma.ride.create({
    data: {
      clientId,

      pickupLat: data.pickupLat,
      pickupLng: data.pickupLng,
      pickupAddress: data.pickupAddress,

      dropoffLat: data.dropoffLat,
      dropoffLng: data.dropoffLng,
      dropoffAddress: data.dropoffAddress,

      rideMode: data.rideMode,
      rideFlow: data.rideFlow,
      serviceType: data.serviceType,

      maxPassengers: data.maxPassengers,
      availableSeats: data.availableSeats,

      systemFare: data.systemFare,
      finalFare: data.finalFare,
      discountAmount: data.discountAmount,

      distance: data.distance,
      duration: data.duration,

      clientOffer: data.clientOffer,

      status: "REQUESTED",
    },
  });
}

// ─────────────────────────────────────────────
// Find Ride by ID
// ─────────────────────────────────────────────

export async function findRideById(rideId: number) {
  return prisma.ride.findUnique({
    where: { id: rideId },
  });
}

// ─────────────────────────────────────────────
// Find Ride with Full Details
// ─────────────────────────────────────────────

export async function findRideWithDetails(rideId: number) {
  return prisma.ride.findUnique({
    where: { id: rideId },
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
      couponUsage: true,
      payment: true,
      review: true,
    },
  });
}

// ─────────────────────────────────────────────
// Get User Rides
// ─────────────────────────────────────────────

export async function getUserRides(userId: number, query: GetRidesQueryDTO) {
  const { status, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: any = { clientId: userId };
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

  return { rides, total };
}

// ─────────────────────────────────────────────
// Get Available Rides (for drivers)
// ─────────────────────────────────────────────

export async function getAvailableRides(serviceType: ServiceType) {
  return prisma.ride.findMany({
    where: {
      status: "REQUESTED",
      driverId: null,
      OR: [{ serviceType }, { rideMode: "CARPOOLING" }],
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
    },
    orderBy: { requestedAt: "desc" },
    take: 50,
  });
}

// ─────────────────────────────────────────────
// Find Driver by User ID
// ─────────────────────────────────────────────

export async function findDriverByUserId(userId: number) {
  return prisma.driver.findUnique({
    where: { userId },
  });
}