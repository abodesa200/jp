import { prisma } from "@/lib/prisma";
import { forbidden, unauthorized, verifyToken } from "@/services/auth/auth";
import { NextRequest } from "next/server";

// GET /api/admin/rides?status=COMPLETED&page=1&limit=20
export async function GET(req: NextRequest) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN") return forbidden();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const skip = (page - 1) * limit;

  const where = status ? { status: status as any } : {};

  try {
    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
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
