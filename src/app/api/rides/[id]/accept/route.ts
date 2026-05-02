import { prisma } from "@/lib/prisma";
import { emitSocketEvent } from "@/lib/socket/emit";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { NextRequest } from "next/server";

// POST /api/rides/:id/accept - Driver accepts ride
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  // ✅ فقط DRIVER يقدر يقبل رحلة
  if (payload.role !== "DRIVER") {
    return Response.json(
      { error: "Only drivers can accept rides" },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    // Verify user is a driver
    const driver = await prisma.driver.findUnique({
      where: { userId: payload.userId },
    });

    if (!driver) {
      return Response.json(
        { error: "Driver profile not found" },
        { status: 404 },
      );
    }

    if (!driver.isApproved) {
      return Response.json(
        { error: "Your driver account is not approved yet" },
        { status: 403 },
      );
    }

    if (!driver.isOnline) {
      return Response.json(
        { error: "You must be online to accept rides" },
        { status: 400 },
      );
    }

    // RACE CONDITION FIX: Atomic update with condition check
    // This prevents multiple drivers from accepting the same ride
    const updatedRide = await prisma.ride.updateMany({
      where: {
        id,
        status: "REQUESTED", // Only update if still REQUESTED
        driverId: null, // Only update if no driver assigned
      },
      data: {
        driverId: driver.id,
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    // If count is 0, ride was already accepted by another driver
    if (updatedRide.count === 0) {
      const existingRide = await prisma.ride.findUnique({
        where: { id },
        select: { status: true, driverId: true },
      });

      if (!existingRide) {
        return Response.json({ error: "Ride not found" }, { status: 404 });
      }

      if (existingRide.driverId && existingRide.driverId !== driver.id) {
        return Response.json(
          { error: "Ride already accepted by another driver" },
          { status: 409 },
        );
      }

      return Response.json(
        { error: `Ride is already ${existingRide.status.toLowerCase()}` },
        { status: 400 },
      );
    }

    // Fetch full ride details after successful update
    const ride = await prisma.ride.findUnique({
      where: { id },
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
      },
    });

    // Emit socket events (don't wait for them)
    emitSocketEvent(`user:${ride!.clientId}`, "ride:accepted", { ride });
    emitSocketEvent(`ride:${id}`, "ride:accepted", { ride });

    return Response.json({
      ride,
      message: "Ride accepted successfully",
    });
  } catch (error) {
    console.error("Error accepting ride:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
