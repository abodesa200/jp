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

export async function updateClientProfileService(
    payload: JWTPayload,
    data: UpdateClientProfileDTO
) {
    // التحقق من email إذا تم تغييره
    if (data.email) {
        const existing = await profileRepository.findByEmail(data.email);
        if (existing && existing.id !== payload.userId) {
            throw new ConflictError("Email already in use");
        }
    }

    // التحقق من phone إذا تم تغييره
    if (data.phone) {
        const existing = await profileRepository.findByPhone(data.phone);
        if (existing && existing.id !== payload.userId) {
            throw new ConflictError("Phone already in use");
        }
    }

    const updatedUser = await profileRepository.updateClientProfile(
        payload.userId,
        data
    );

    return {
        user: updatedUser,
    };
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

export async function updateDriverProfileService(
    payload: JWTPayload,
    data: UpdateDriverProfileDTO
) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can update driver profile");
    }

    const driver = await profileRepository.findDriverProfile(payload.userId);

    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    // فصل بيانات الـ user عن بيانات الـ driver
    const userData: {
        name?: string;
        email?: string;
        phone?: string;
        avatarUrl?: string;
    } = {};

    const driverData: {
        licenseNumber?: string;
        carModel?: string;
        carPlate?: string;
        carColor?: string;
        carYear?: number;
        isOnline?: boolean;
        latitude?: number;
        longitude?: number;
        lastLocationUpdate?: Date;
    } = {};

    // User fields
    if (data.name !== undefined) userData.name = data.name;
    if (data.email !== undefined) userData.email = data.email;
    if (data.phone !== undefined) userData.phone = data.phone;
    if (data.avatarUrl !== undefined) userData.avatarUrl = data.avatarUrl;

    // Driver fields
    if (data.licenseNumber !== undefined)
        driverData.licenseNumber = data.licenseNumber;
    if (data.carModel !== undefined) driverData.carModel = data.carModel;
    if (data.carPlate !== undefined) driverData.carPlate = data.carPlate;
    if (data.carColor !== undefined) driverData.carColor = data.carColor;
    if (data.carYear !== undefined) driverData.carYear = data.carYear;
    if (data.isOnline !== undefined) driverData.isOnline = data.isOnline;
    if (data.latitude !== undefined) driverData.latitude = data.latitude;
    if (data.longitude !== undefined) driverData.longitude = data.longitude;

    // Update lastLocationUpdate if location changed
    if (data.latitude !== undefined || data.longitude !== undefined) {
        driverData.lastLocationUpdate = new Date();
    }

    // التحقق من email إذا تم تغييره
    if (userData.email) {
        const existing = await profileRepository.findByEmail(userData.email);
        if (existing && existing.id !== payload.userId) {
            throw new ConflictError("Email already in use");
        }
    }

    // التحقق من phone إذا تم تغييره
    if (userData.phone) {
        const existing = await profileRepository.findByPhone(userData.phone);
        if (existing && existing.id !== payload.userId) {
            throw new ConflictError("Phone already in use");
        }
    }

    // تحديث user data إذا في تغييرات
    if (Object.keys(userData).length > 0) {
        await profileRepository.updateDriverUser(payload.userId, userData);
    }

    // تحديث driver data
    const updatedDriver = await profileRepository.updateDriverData(
        payload.userId,
        driverData
    );

    return updatedDriver;
}
