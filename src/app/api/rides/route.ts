import { prisma } from "@/lib/prisma";
import { emitSocketEvent } from "@/lib/socket/emit";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { NextRequest } from "next/server";

// Helper: حساب المسافة بين نقطتين (Haversine formula)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
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

// Helper: حساب السعر بناءً على المسافة
function calculateFare(distanceKm: number): number {
  const baseFare = 5; // سعر البداية
  const perKm = 2; // سعر الكيلومتر
  const minFare = 5; // أقل سعر

  const fare = baseFare + distanceKm * perKm;
  return Math.max(fare, minFare);
}

// POST /api/rides - إنشاء رحلة جديدة
export async function POST(req: NextRequest) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  // ✅ فقط CLIENT يقدر يطلب رحلة
  if (payload.role !== "CLIENT") {
    return Response.json(
      { error: "Only clients can request rides" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      pickupLat,
      pickupLng,
      pickupAddress,
      dropoffLat,
      dropoffLng,
      dropoffAddress,
      type = "STANDARD",
      maxPassengers = 1,
    } = body;

    // Validation
    if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
      return Response.json(
        { error: "Pickup and dropoff coordinates are required" },
        { status: 400 },
      );
    }

    // حساب المسافة والسعر
    const distance = calculateDistance(
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
    );
    const systemFare = calculateFare(distance);
    const estimatedDuration = Math.ceil((distance / 40) * 60); // 40 km/h average

    // إنشاء الرحلة
    const ride = await prisma.ride.create({
      data: {
        clientId: payload.userId,
        pickupLat,
        pickupLng,
        pickupAddress,
        dropoffLat,
        dropoffLng,
        dropoffAddress,
        type,
        maxPassengers,
        availableSeats: maxPassengers,
        systemFare,
        distance,
        duration: estimatedDuration,
        status: "REQUESTED",
      },
    });

    // Notify all online drivers about new ride
    emitSocketEvent("drivers", "ride:created", {
      ride: {
        id: ride.id,
        status: ride.status,
        pickup: {
          lat: ride.pickupLat,
          lng: ride.pickupLng,
          address: ride.pickupAddress,
        },
        dropoff: {
          lat: ride.dropoffLat,
          lng: ride.dropoffLng,
          address: ride.dropoffAddress,
        },
        systemFare: ride.systemFare,
        distance: ride.distance,
        estimatedDuration: ride.duration,
        type: ride.type,
        requestedAt: ride.requestedAt,
      },
    });

    return Response.json({
      ride: {
        id: ride.id,
        status: ride.status,
        pickup: {
          lat: ride.pickupLat,
          lng: ride.pickupLng,
          address: ride.pickupAddress,
        },
        dropoff: {
          lat: ride.dropoffLat,
          lng: ride.dropoffLng,
          address: ride.dropoffAddress,
        },
        systemFare: ride.systemFare,
        distance: ride.distance,
        estimatedDuration: ride.duration,
        type: ride.type,
        requestedAt: ride.requestedAt,
      },
    });
  } catch (error) {
    console.error("Error creating ride:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/rides - جلب رحلات المستخدم
export async function GET(req: NextRequest) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "10"));
  const skip = (page - 1) * limit;

  try {
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

    return Response.json({
      rides,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching rides:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
