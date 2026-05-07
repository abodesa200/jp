import { settingsRepository } from "./settings.repository";
import { UpdateSettingsDTO } from "./settings.schema";

type JWTPayload = {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
};

// ─────────────────────────────────────────────
// Get User Settings
// ─────────────────────────────────────────────

export async function getSettingsService(payload: JWTPayload) {
    // upsert: إذا ما في settings ننشئ default
    const settings = await settingsRepository.upsert(
        payload.userId,
        {},
        {
            language: "ar",
            notifyRideUpdates: true,
            notifyPromotions: true,
            notifySystemMessages: true,
        }
    );

    return settings;
}

// ─────────────────────────────────────────────
// Update User Settings
// ─────────────────────────────────────────────

export async function updateSettingsService(
    payload: JWTPayload,
    data: UpdateSettingsDTO
) {
    const updateData: any = {};

    if (data.language !== undefined) updateData.language = data.language;
    if (data.notifyRideUpdates !== undefined)
        updateData.notifyRideUpdates = data.notifyRideUpdates;
    if (data.notifyPromotions !== undefined)
        updateData.notifyPromotions = data.notifyPromotions;
    if (data.notifySystemMessages !== undefined)
        updateData.notifySystemMessages = data.notifySystemMessages;

    const settings = await settingsRepository.upsert(
        payload.userId,
        updateData,
        {
            language: data.language ?? "ar",
            notifyRideUpdates: data.notifyRideUpdates ?? true,
            notifyPromotions: data.notifyPromotions ?? true,
            notifySystemMessages: data.notifySystemMessages ?? true,
        }
    );

    return settings;
}
