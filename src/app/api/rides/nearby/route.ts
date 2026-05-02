import { prisma } from "@/lib/prisma";
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

// GET /api/rides/nearby - أقرب الرحلات المتاحة للسائق
export async function GET(req: NextRequest) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  // ✅ فقط DRIVER يقدر يشوف الرحلات القريبة
  if (payload.role !== "DRIVER") {
    return Response.json(
      { error: "Only drivers can view nearby rides" },
      { status: 403 }
    );
  }

  try {
    // التحقق من أن المستخدم سائق
    const driver = await prisma.driver.findUnique({
      where: { userId: payload.userId },
    });

    if (!driver) {
      return Response.json(
        { error: "Driver profile not found" },
        { status: 404 }
      );
    }

    if (!driver.isApproved) {
      return forbidden();
    }

    const { searchParams } = new URL(req.url);
    const maxDistance = parseFloat(searchParams.get("maxDistance") ?? "10"); // km
    const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "10"));

    // التحقق من موقع السائق
    if (!driver.latitude || !driver.longitude) {
      return Response.json(
        {
          error: "Driver location not available. Please update your location.",
        },
        { status: 400 },
      );
    }

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
      take: 50, // نجيب 50 ونفلترهم بالمسافة
    });

    // حساب المسافة وفلترة
    const ridesWithDistance = availableRides
      .map((ride) => {
        const distance = calculateDistance(
          driver.latitude!,
          driver.longitude!,
          ride.pickupLat,
          ride.pickupLng,
        );

        return {
          ...ride,
          distanceFromDriver: parseFloat(distance.toFixed(2)),
        };
      })
      .filter((ride) => ride.distanceFromDriver <= maxDistance)
      .sort((a, b) => a.distanceFromDriver - b.distanceFromDriver)
      .slice(0, limit);

    return Response.json({
      rides: ridesWithDistance,
      driverLocation: {
        lat: driver.latitude,
        lng: driver.longitude,
      },
      filters: {
        maxDistance,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching nearby rides:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
