import { prisma } from "@/lib/prisma";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { NextRequest } from "next/server";

// POST /api/rides/:id/negotiate - إنشاء أو تحديث عرض تفاوض
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const { amount, message } = body;

  try {
    if (!amount || amount <= 0) {
      return Response.json(
        { error: "Valid amount is required" },
        { status: 400 },
      );
    }

    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        driver: true,
        negotiation: true,
      },
    });

    if (!ride) {
      return Response.json({ error: "Ride not found" }, { status: 404 });
    }

    // التحقق من الصلاحيات
    const isClient = ride.clientId === payload.userId;
    const isDriver = ride.driver?.userId === payload.userId;

    if (!isClient && !isDriver) {
      return Response.json(
        { error: "You don't have permission to negotiate this ride" },
        { status: 403 },
      );
    }

    // التحقق من حالة الرحلة
    if (ride.status !== "REQUESTED") {
      return Response.json(
        { error: "Can only negotiate on requested rides" },
        { status: 400 },
      );
    }

    const offeredBy = isClient ? "CLIENT" : "DRIVER";

    // إذا في تفاوض موجود
    if (ride.negotiation) {
      // التحقق من انتهاء المهلة
      if (ride.negotiation.expiresAt < new Date()) {
        await prisma.negotiation.update({
          where: { id: ride.negotiation.id },
          data: { status: "EXPIRED" },
        });
        return Response.json(
          { error: "Negotiation has expired" },
          { status: 400 },
        );
      }

      // التحقق من الحالة
      if (
        ride.negotiation.status === "ACCEPTED" ||
        ride.negotiation.status === "REJECTED"
      ) {
        return Response.json(
          {
            error: `Negotiation is already ${ride.negotiation.status.toLowerCase()}`,
          },
          { status: 400 },
        );
      }

      // تحديث التفاوض
      const updateData: any = {
        status: "COUNTERED",
      };

      if (isClient) {
        updateData.clientOffer = amount;
      } else {
        updateData.driverCounter = amount;
      }

      const updatedNegotiation = await prisma.negotiation.update({
        where: { id: ride.negotiation.id },
        data: updateData,
      });

      // إضافة العرض للتاريخ
      await prisma.negotiationOffer.create({
        data: {
          negotiationId: updatedNegotiation.id,
          offeredBy,
          amount,
          message,
        },
      });

      const fullNegotiation = await prisma.negotiation.findUnique({
        where: { id: updatedNegotiation.id },
        include: {
          history: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      // إرسال إشعار للطرف الآخر عبر WebSocket
      // TODO: integrate with socket server

      return Response.json({
        negotiation: fullNegotiation,
        message: "Counter offer sent successfully",
      });
    }

    // إنشاء تفاوض جديد (الزبون بيبدأ)
    if (!isClient) {
      return Response.json(
        { error: "Only clients can start negotiation" },
        { status: 403 },
      );
    }

    const negotiation = await prisma.negotiation.create({
      data: {
        rideId: ride.id,
        systemFare: ride.systemFare!,
        clientOffer: amount,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 دقائق
        history: {
          create: {
            offeredBy: "CLIENT",
            amount,
            message,
          },
        },
      },
      include: {
        history: true,
      },
    });

    // إرسال إشعار للسواقين عبر WebSocket
    // TODO: integrate with socket server

    return Response.json({
      negotiation,
      message: "Negotiation started successfully",
    });
  } catch (error) {
    console.error("Error negotiating ride:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/rides/:id/negotiate - قبول أو رفض التفاوض
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const { action } = body; // "accept" or "reject"

  try {
    if (!action || !["accept", "reject"].includes(action)) {
      return Response.json(
        { error: 'Action must be "accept" or "reject"' },
        { status: 400 },
      );
    }

    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        driver: true,
        negotiation: true,
      },
    });

    if (!ride || !ride.negotiation) {
      return Response.json(
        { error: "Ride or negotiation not found" },
        { status: 404 },
      );
    }

    // التحقق من الصلاحيات
    const isClient = ride.clientId === payload.userId;
    const isDriver = ride.driver?.userId === payload.userId;

    if (!isClient && !isDriver) {
      return Response.json(
        { error: "You don't have permission to respond to this negotiation" },
        { status: 403 },
      );
    }

    // التحقق من انتهاء المهلة
    if (ride.negotiation.expiresAt < new Date()) {
      await prisma.negotiation.update({
        where: { id: ride.negotiation.id },
        data: { status: "EXPIRED" },
      });
      return Response.json(
        { error: "Negotiation has expired" },
        { status: 400 },
      );
    }

    if (action === "accept") {
      // تحديد السعر المتفق عليه
      let agreedFare: number;
      if (isClient && ride.negotiation.driverCounter) {
        agreedFare = ride.negotiation.driverCounter;
      } else if (isDriver && ride.negotiation.clientOffer) {
        agreedFare = ride.negotiation.clientOffer;
      } else {
        return Response.json({ error: "No offer to accept" }, { status: 400 });
      }

      const updatedNegotiation = await prisma.negotiation.update({
        where: { id: ride.negotiation.id },
        data: {
          status: "ACCEPTED",
          agreedFare,
        },
        include: {
          history: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      // تحديث سعر الرحلة
      await prisma.ride.update({
        where: { id },
        data: { fare: agreedFare },
      });

      return Response.json({
        negotiation: updatedNegotiation,
        message: "Negotiation accepted successfully",
      });
    } else {
      // رفض التفاوض
      const updatedNegotiation = await prisma.negotiation.update({
        where: { id: ride.negotiation.id },
        data: { status: "REJECTED" },
        include: {
          history: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      return Response.json({
        negotiation: updatedNegotiation,
        message: "Negotiation rejected",
      });
    }
  } catch (error) {
    console.error("Error responding to negotiation:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
