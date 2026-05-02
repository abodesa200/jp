import { prisma } from "@/lib/prisma";
import { emitSocketEvent } from "@/lib/socket/emit";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { NextRequest } from "next/server";

// GET /api/rides/:id - تفاصيل رحلة
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  const { id } = await params;

  try {
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
      return Response.json({ error: "Ride not found" }, { status: 404 });
    }

    // التحقق من الصلاحيات
    const isClient = ride.clientId === payload.userId;
    const isDriver = ride.driver?.userId === payload.userId;
    const isAdmin = payload.role === "ADMIN";

    if (!isClient && !isDriver && !isAdmin) {
      return Response.json(
        { error: "You don't have access to this ride" },
        { status: 403 },
      );
    }

    return Response.json({ ride });
  } catch (error) {
    console.error("Error fetching ride:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/rides/:id - تحديث حالة الرحلة
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  const body = await req.json();

  try {
    const ride = await prisma.ride.findUnique({
      where: { id },
      include: { driver: true },
    });

    if (!ride) {
      return Response.json({ error: "Ride not found" }, { status: 404 });
    }

    // التحقق من الصلاحيات
    const isClient = ride.clientId === payload.userId;
    const isDriver = ride.driver?.userId === payload.userId;
    const isAdmin = payload.role === "ADMIN";

    if (!isClient && !isDriver && !isAdmin) {
      return Response.json(
        { error: "You don't have access to this ride" },
        { status: 403 },
      );
    }

    // تحديث الحالة
    const { status, cancelReason } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;

      // تحديث timestamps حسب الحالة
      if (status === "ACCEPTED" && !ride.acceptedAt) {
        updateData.acceptedAt = new Date();
      } else if (status === "IN_PROGRESS" && !ride.startedAt) {
        updateData.startedAt = new Date();
      } else if (status === "COMPLETED" && !ride.completedAt) {
        updateData.completedAt = new Date();
      } else if (status === "CANCELLED") {
        updateData.cancelledAt = new Date();
        if (cancelReason) {
          updateData.cancelReason = cancelReason;
        }
      }
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: updateData,
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

    // Emit socket events based on status
    const notifyUserId = isClient ? ride.driver?.userId : ride.clientId;
    if (notifyUserId) {
      emitSocketEvent(`user:${notifyUserId}`, `ride:${status.toLowerCase()}`, {
        ride: updatedRide,
      });
    }
    emitSocketEvent(`ride:${id}`, `ride:${status.toLowerCase()}`, {
      ride: updatedRide,
    });

    return Response.json({ ride: updatedRide });
  } catch (error) {
    console.error("Error updating ride:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
