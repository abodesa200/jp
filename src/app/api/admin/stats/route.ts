import { prisma } from "@/lib/prisma";
import { forbidden, unauthorized, verifyToken } from "@/services/auth/auth";
import { NextRequest } from "next/server";

// GET /api/admin/stats - إحصائيات الداشبورد
export async function GET(req: NextRequest) {
  const payload = await verifyToken(req);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN") return forbidden();

  try {
    // إحصائيات عامة
    const [
      totalUsers,
      totalDrivers,
      totalRides,
      activeRides,
      completedRides,
      cancelledRides,
      pendingDrivers,
      onlineDrivers,
      totalRevenue,
    ] = await Promise.all([
      // إجمالي المستخدمين
      prisma.user.count({ where: { role: "CLIENT" } }),

      // إجمالي السائقين
      prisma.driver.count(),

      // إجمالي الرحلات
      prisma.ride.count(),

      // الرحلات النشطة
      prisma.ride.count({
        where: {
          status: { in: ["REQUESTED", "ACCEPTED", "IN_PROGRESS"] },
        },
      }),

      // الرحلات المكتملة
      prisma.ride.count({ where: { status: "COMPLETED" } }),

      // الرحلات الملغاة
      prisma.ride.count({ where: { status: "CANCELLED" } }),

      // السائقين المعلقين
      prisma.driver.count({ where: { isApproved: false } }),

      // السائقين المتصلين
      prisma.driver.count({ where: { isOnline: true, isApproved: true } }),

      // إجمالي الإيرادات
      prisma.ride.aggregate({
        where: { status: "COMPLETED" },
        _sum: { fare: true },
      }),
    ]);

    // إحصائيات آخر 7 أيام
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentRides, recentUsers, recentDrivers] = await Promise.all([
      prisma.ride.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo }, role: "CLIENT" },
      }),
      prisma.driver.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    // أفضل السائقين (حسب التقييم)
    const topDrivers = await prisma.driver.findMany({
      where: { totalRides: { gt: 0 } },
      orderBy: { rating: "desc" },
      take: 5,
      include: {
        user: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
      },
    });

    // آخر الرحلات
    const recentRidesData = await prisma.ride.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
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

    return Response.json({
      overview: {
        totalUsers,
        totalDrivers,
        totalRides,
        activeRides,
        completedRides,
        cancelledRides,
        pendingDrivers,
        onlineDrivers,
        totalRevenue: totalRevenue._sum.fare || 0,
      },
      recent: {
        rides: recentRides,
        users: recentUsers,
        drivers: recentDrivers,
      },
      topDrivers,
      recentRides: recentRidesData,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
