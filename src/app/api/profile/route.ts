import { prisma } from "@/lib/prisma";
import { unauthorized, verifyToken } from "@/services/auth/auth";
import { NextRequest } from "next/server";

// GET /api/profile — جلب بيانات المستخدم الحالي
export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
            id: true,
            phone: true,
            role: true,
            name: true,
            email: true,
            avatarUrl: true,
            isVerified: true,
            createdAt: true,
            // السائق بس إذا كان الدور DRIVER
            driver:
                payload.role === "DRIVER"
                    ? {
                        select: {
                            id: true,
                            licenseNumber: true,
                            carModel: true,
                            carPlate: true,
                            carColor: true,
                            carYear: true,
                            isApproved: true,
                            isOnline: true,
                            rating: true,
                            totalRides: true,
                        },
                    }
                    : false,
        },
    });

    if (!user) return unauthorized();

    return Response.json({ user });
}

// PATCH /api/profile — تعديل بيانات المستخدم
export async function PATCH(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    const body = await req.json();

    // الحقول المسموح للمستخدم يعدّلها
    const { name, email, avatarUrl } = body;

    const updated = await prisma.user.update({
        where: { id: payload.userId },
        data: {
            ...(name !== undefined && { name }),
            ...(email !== undefined && { email }),
            ...(avatarUrl !== undefined && { avatarUrl }),
        },
        select: {
            id: true,
            phone: true,
            role: true,
            name: true,
            email: true,
            avatarUrl: true,
        },
    });

    return Response.json({ user: updated });
}
