import { prisma } from "@/lib/prisma";
import { forbidden, unauthorized, verifyToken } from "@/services/auth/auth";
import { NextRequest } from "next/server";

// GET /api/admin/rides/:id - تفاصيل رحلة كاملة
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN") return forbidden();

  // const { id } = await params;
  const id = Number((await params).id);

  if (isNaN(id)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
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
                email: true,
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

    return Response.json({ ride });
  } catch (error) {
    console.error("Error fetching ride:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/rides/:id - حذف رحلة
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN") return forbidden();

  // const { id } = await params;
  const id = Number((await params).id);

  if (isNaN(id)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }


  try {
    await prisma.ride.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting ride:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
