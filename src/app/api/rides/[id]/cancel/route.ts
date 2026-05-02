import { prisma } from "@/lib/prisma";
import { emitSocketEvent } from "@/lib/socket/emit";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { NextRequest } from "next/server";

// POST /api/rides/:id/cancel - Cancel ride
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const { reason } = body;

  try {
    const ride = await prisma.ride.findUnique({
      where: { id },
      include: { driver: true },
    });

    if (!ride) {
      return Response.json({ error: "Ride not found" }, { status: 404 });
    }

    // Check permissions
    const isClient = ride.clientId === payload.userId;
    const isDriver = ride.driver?.userId === payload.userId;

    if (!isClient && !isDriver) {
      return Response.json(
        { error: "You don't have permission to cancel this ride" },
        { status: 403 },
      );
    }

    // Check ride status
    if (ride.status === "COMPLETED") {
      return Response.json(
        { error: "Cannot cancel a completed ride" },
        { status: 400 },
      );
    }

    if (ride.status === "CANCELLED") {
      return Response.json(
        { error: "Ride is already cancelled" },
        { status: 400 },
      );
    }

    // Cancel ride
    const cancelledBy = isClient ? "CLIENT" : "DRIVER";
    const cancelReason = reason || `Cancelled by ${cancelledBy.toLowerCase()}`;

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: `[${cancelledBy}] ${cancelReason}`,
      },
      include: {
        client: {
          select: { id: true, name: true, phone: true },
        },
        driver: {
          include: {
            user: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    });

    // Notify the other party
    const notifyUserId = isClient ? ride.driver?.userId : ride.clientId;
    if (notifyUserId) {
      emitSocketEvent(`user:${notifyUserId}`, "ride:cancelled", {
        ride: updatedRide,
      });
    }

    // Notify ride room
    emitSocketEvent(`ride:${id}`, "ride:cancelled", { ride: updatedRide });

    return Response.json({
      ride: updatedRide,
      message: "Ride cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling ride:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
