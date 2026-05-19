import { prisma } from "@/lib/prisma";
import { CreateRideDTO, GetRidesQueryDTO } from "./rides.schema";

// ─────────────────────────────────────────────
// Create Ride
// ─────────────────────────────────────────────

export async function createRide(
  clientId: number,
  data: CreateRideDTO & {
    distance: number;
    systemFare: number;
    estimatedDuration: number;
  },
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
      serviceType: data.serviceType,
      maxPassengers: data.maxPassengers,
      availableSeats: data.maxPassengers,
      systemFare: data.systemFare,
      distance: data.distance,
      
      duration: data.estimatedDuration,
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

export async function getAvailableRides() {
  return prisma.ride.findMany({
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
}

// ─────────────────────────────────────────────
// Find Driver by User ID
// ─────────────────────────────────────────────

export async function findDriverByUserId(userId: number) {
  return prisma.driver.findUnique({
    where: { userId },
  });
}
