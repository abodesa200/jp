import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { profileRepository } from "./profile.repository";
import {
    UpdateClientProfileDTO,
    UpdateDriverProfileDTO,
} from "./profile.schema";
import { assertClientExists, assertDriverRole, assertEmailUnique, assertPhoneUnique } from "./profile.rules";
import { mapClientUpdate, mapDriverUpdate } from "./profile.mapper";

type JWTPayload = {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
};

// ─────────────────────────────────────────────
// Get Client Profile
// ─────────────────────────────────────────────

export async function getClientProfileService(payload: JWTPayload) {
    const user = await profileRepository.findClientProfile(payload.userId);

    if (!user) {
        throw new NotFoundError("User not found");
    }

    return user;
}

// ─────────────────────────────────────────────
// Update Client Profile
// ─────────────────────────────────────────────

export async function updateClientProfileService(payload: JWTPayload, data:UpdateClientProfileDTO) {
    await assertClientExists(payload.userId)

    const { userData } = mapClientUpdate(data)

    if (userData.email) {
        await assertEmailUnique(userData.email, payload.userId)
    }

    if (userData.phone) {
        await assertPhoneUnique(userData.phone, payload.userId)
    }

    const updated = await profileRepository.updateClientProfile(
        payload.userId,
        userData
    )

    return { user: updated }
}

// ─────────────────────────────────────────────
// Get Driver Profile
// ─────────────────────────────────────────────

export async function getDriverProfileService(payload: JWTPayload) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can access driver profile");
    }

    const driver = await profileRepository.findDriverProfile(payload.userId);

    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    return driver;
}

// ─────────────────────────────────────────────
// Update Driver Profile
// ─────────────────────────────────────────────

export async function updateDriverProfileService(payload: JWTPayload, data:UpdateDriverProfileDTO) {
    await assertDriverRole(payload.role)

    const driver = await profileRepository.findDriverProfile(payload.userId)
    if (!driver) throw new Error("Driver not found")

    const { userData, driverData } = mapDriverUpdate(data)

    if (userData.email) {
        await assertEmailUnique(userData.email, payload.userId)
    }

    if (userData.phone) {
        await assertPhoneUnique(userData.phone, payload.userId)
    }

    if (Object.keys(userData).length) {
        await profileRepository.updateDriverUser(payload.userId, userData)
    }

    return profileRepository.updateDriverData(payload.userId, driverData)
}