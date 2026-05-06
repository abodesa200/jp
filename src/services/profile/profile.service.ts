import { ConflictError, NotFoundError } from "@/core/http/http-errors";
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
        include: {
            driver: true,
        },
    });

    if (!user) throw new NotFoundError("User not found");

    // إذا مو driver → لا ترجع driver
    if (user.role !== "DRIVER") {
        return { ...user, driver: undefined };
    }

    return user;
}

export async function updateProfileService(payload: Payload, body: unknown) {
    const data = updateProfileSchema.parse(body);

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { driver: true },
    });

    if (!user) throw new NotFoundError("User not found");

    // email check
    if (data.email) {
        const existing = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existing && existing.id !== payload.userId) {
            throw new ConflictError("Email already in use");
        }
    }

    const updateData: any = {};

    if ("name" in data) updateData.name = data.name;
    if ("email" in data) updateData.email = data.email;
    if ("avatarUrl" in data) updateData.avatarUrl = data.avatarUrl;

    const updatedUser = await prisma.user.update({
        where: { id: payload.userId },
        data: updateData,
    });

    let updatedDriver = null;

    if (user.role === "DRIVER" && data.driverInfo) {
        updatedDriver = await updateDriverInfo(payload.userId, data.driverInfo);
    }

    return {
        user: updatedUser,
        ...(updatedDriver && { driver: updatedDriver }),
    };
}