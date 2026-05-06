import { prisma } from "@/lib/prisma";
import { UpdateSettingsDTO } from "./settings.schema";

type Payload = {
    userId: number;
    role: string;
};

// ─────────────────────────────────────────────
// Get User Settings
// ─────────────────────────────────────────────

export async function getSettingsService(payload: Payload) {
    // upsert: إذا ما في settings ننشئ default
    const settings = await prisma.userSettings.upsert({
        where: { userId: payload.userId },
        update: {},
        create: {
            userId: payload.userId,
            language: "ar",
            notifyRideUpdates: true,
            notifyPromotions: true,
            notifySystemMessages: true,
        },
    });

    return settings;
}

// ─────────────────────────────────────────────
// Update User Settings
// ─────────────────────────────────────────────

export async function updateSettingsService(payload: Payload, data: UpdateSettingsDTO) {
    const settings = await prisma.userSettings.upsert({
        where: { userId: payload.userId },
        update: {
            ...(data.language !== undefined && { language: data.language }),
            ...(data.notifyRideUpdates !== undefined && { notifyRideUpdates: data.notifyRideUpdates }),
            ...(data.notifyPromotions !== undefined && { notifyPromotions: data.notifyPromotions }),
            ...(data.notifySystemMessages !== undefined && { notifySystemMessages: data.notifySystemMessages }),
        },
        create: {
            userId: payload.userId,
            language: data.language ?? "ar",
            notifyRideUpdates: data.notifyRideUpdates ?? true,
            notifyPromotions: data.notifyPromotions ?? true,
            notifySystemMessages: data.notifySystemMessages ?? true,
        },
    });

    return settings;
}
