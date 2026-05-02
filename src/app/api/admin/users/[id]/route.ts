import { prisma } from "@/lib/prisma";
import { forbidden, unauthorized, verifyToken } from "@/services/auth/auth";
import { NextRequest } from "next/server";

// GET /api/admin/users/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    const { id } = await params;
    const userId = parseInt(id);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            phone: true,
            role: true,
            name: true,
            email: true,
            avatarUrl: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            driver: {
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
            },
        },
    });

    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json({ user });
}

// PATCH /api/admin/users/:id — تعديل أي حقل
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    const { id } = await params;
    const userId = parseInt(id);
    const body = await req.json();

    const { name, email, avatarUrl, role, isVerified, isApproved } = body;

    const user = await prisma.user.update({
    where: { id: userId },
    data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(role !== undefined && { role }),
        ...(isVerified !== undefined && { isVerified }),

        ...(isApproved !== undefined && {
            driver: {
                update: {
                    isApproved: Boolean(isApproved),
                },
            },
        }),
    },
    include: {
        driver: true,
    },
});

    return Response.json({ user });
}

// DELETE /api/admin/users/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    const { id } = await params;
    const userId = parseInt(id);

    await prisma.user.delete({ where: { id: userId } });

    return Response.json({ success: true });
}
