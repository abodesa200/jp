import { prisma } from "@/lib/prisma";
import { emitSocketEvent } from "@/lib/socket/emit";
import { forbidden, unauthorized, verifyToken } from "@/services/auth/auth";
import { NextRequest } from "next/server";

// Helper: حساب المسافة بين نقطتين
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: حساب السعر
function calculateFare(distanceKm: number): number {
  const baseFare = 5;
  const perKm = 2;
  const minFare = 5;
  const fare = baseFare + distanceKm * perKm;
  return Math.max(fare, minFare);
}

// POST /api/admin/rides/create - Admin creates a ride
export async function POST(req: NextRequest) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN") return forbidden();

  try {
    const body = await req.json();
    const {
      clientId,
      driverId,
      pickupLat,
      pickupLng,
      pickupAddress,
      dropoffLat,
      dropoffLng,
      dropoffAddress,
      type = "STANDARD",
      notes,
    } = body;

    // Validation
    if (!clientId || !pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
      return Response.json(
        { error: "Client and location coordinates are required" },
        { status: 400 },
      );
    }

    // Verify client exists
    const client = await prisma.user.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify driver if provided
    let driver = null;
    if (driverId) {
      driver = await prisma.driver.findUnique({
        where: { id: driverId },
      });

      if (!driver) {
        return Response.json({ error: "Driver not found" }, { status: 404 });
      }

      if (!driver.isApproved) {
        return Response.json(
          { error: "Driver is not approved" },
          { status: 400 },
        );
      }
    }

    // Calculate distance and fare
    const distance = calculateDistance(
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
    );
    const systemFare = calculateFare(distance);
    const estimatedDuration = Math.ceil((distance / 40) * 60);

    // Create ride
    const ride = await prisma.ride.create({
      data: {
        clientId,
        driverId: driverId || null,
        pickupLat,
        pickupLng,
        pickupAddress,
        dropoffLat,
        dropoffLng,
        dropoffAddress,
        type,
        maxPassengers: type === "CARPOOLING" ? 4 : 1,
        availableSeats: type === "CARPOOLING" ? 4 : 1,
        systemFare,
        fare: systemFare,
        distance,
        duration: estimatedDuration,
        status: driverId ? "ACCEPTED" : "REQUESTED",
        ...(driverId && { acceptedAt: new Date() }),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
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
    });

    // Send notifications
    if (driverId) {
      // Notify driver
      emitSocketEvent(`user:${driver!.userId}`, "ride:assigned", { ride });
      // Notify client
      emitSocketEvent(`user:${clientId}`, "ride:accepted", { ride });
      // Notify ride room
      emitSocketEvent(`ride:${ride.id}`, "ride:accepted", { ride });
    } else {
      // Notify all drivers
      emitSocketEvent("drivers", "ride:created", { ride });
      // Notify client
      emitSocketEvent(`user:${clientId}`, "ride:created", { ride });
    }

    return Response.json(
      {
        ride,
        message: "Ride created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating ride:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
