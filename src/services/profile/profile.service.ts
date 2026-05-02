import { ConflictError } from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import { updateDriverInfo } from "../driver/driver.service";
import { updateProfileSchema } from "./profile.schema";

type Payload = {
    userId: number;
    role: string;
};

export async function getProfileService(payload: Payload) {
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
                    : undefined,
        },
    });

    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    return user;
}


export async function updateProfileService(payload: Payload, body: unknown) {
    const data = updateProfileSchema.parse(body);

    const existing = data.email
        ? await prisma.user.findUnique({ where: { email: data.email } })
        : null;

    if (existing && existing.id !== payload.userId) {
        throw new ConflictError("Email already in use");
    }

    const updatedUser = await prisma.user.update({
        where: { id: payload.userId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.email && { email: data.email }),
            ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
        },
    });

    let updatedDriver = null;

    if (payload.role === "DRIVER" && data.driverInfo) {
        updatedDriver = await updateDriverInfo(payload.userId, data.driverInfo);
    }

    return {
        user: updatedUser,
        ...(updatedDriver && { driver: updatedDriver }),

    };
}