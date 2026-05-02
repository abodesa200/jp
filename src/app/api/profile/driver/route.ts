import { prisma } from "@/lib/prisma";
import { forbidden, unauthorized, verifyToken } from "@/services/auth/auth";
import { NextRequest } from "next/server";

// GET /api/profile/driver — جلب بيانات السائق الكاملة
export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "DRIVER") return forbidden();

    const driver = await prisma.driver.findUnique({
        where: { userId: payload.userId },
        include: {
            user: {
                select: {
                    id: true,
                    phone: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                },
            },
        },
    });

    if (!driver) {
        return Response.json({ error: "Driver profile not found" }, { status: 404 });
    }

    return Response.json({ driver });
}

// PATCH /api/profile/driver — تعديل بيانات السائق
export async function PATCH(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "DRIVER") return forbidden();

    const body = await req.json();

    // الحقول اللي يقدر السائق يعدّلها بنفسه
    const { carColor, carYear, isOnline } = body;

    // الحقول الحساسة (licenseNumber, carModel, carPlate) بتحتاج موافقة أدمن — ما نسمح بتعديلها هون

    const driver = await prisma.driver.findUnique({
        where: { userId: payload.userId },
    });

    if (!driver) {
        return Response.json({ error: "Driver profile not found" }, { status: 404 });
    }

    const updated = await prisma.driver.update({
        where: { userId: payload.userId },
        data: {
            ...(carColor !== undefined && { carColor }),
            ...(carYear !== undefined && { carYear }),
            ...(isOnline !== undefined && { isOnline }),
        },
        select: {
            id: true,
            carModel: true,
            carPlate: true,
            carColor: true,
            carYear: true,
            isApproved: true,
            isOnline: true,
            rating: true,
            totalRides: true,
        },
    });

    // تعديل بيانات الـ user المرتبطة (name, email, avatarUrl)
    const { name, email, avatarUrl } = body;
    if (name !== undefined || email !== undefined || avatarUrl !== undefined) {
        await prisma.user.update({
            where: { id: payload.userId },
            data: {
                ...(name !== undefined && { name }),
                ...(email !== undefined && { email }),
                ...(avatarUrl !== undefined && { avatarUrl }),
            },
        });
    }

    return Response.json({ driver: updated });
}
