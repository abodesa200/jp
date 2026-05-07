import {
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { driverRepository } from "./driver.repository";
import {
    GetDriverProfileDTO,
    GetDriverReviewsDTO,
    GetDriverStatsDTO,
    GetNearbyDriversDTO,
    UpdateDriverLocationDTO,
    UpdateDriverStatusDTO,
} from "./driver.schema";

type JWTPayload = {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
};

// ─────────────────────────────────────────────
// Get Driver Profile
// ─────────────────────────────────────────────

export async function getDriverProfileService(data: GetDriverProfileDTO) {
    const driver = await driverRepository.findDriverById(data.driverId);

    if (!driver) {
        throw new NotFoundError("Driver not found");
    }

    return driver;
}

// ─────────────────────────────────────────────
// Get My Driver Profile (للسائق نفسه)
// ─────────────────────────────────────────────

export async function getMyDriverProfileService(payload: JWTPayload) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can access this endpoint");
    }

    const driver = await driverRepository.findDriverByUserId(payload.userId);

    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    return driver;
}

// ─────────────────────────────────────────────
// Update Driver Location
// ─────────────────────────────────────────────

export async function updateDriverLocationService(
    payload: JWTPayload,
    data: UpdateDriverLocationDTO
) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can update location");
    }

    const driver = await driverRepository.findDriverByUserId(payload.userId);

    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    const updatedDriver = await driverRepository.updateDriverLocation(
        payload.userId,
        data
    );

    return updatedDriver;
}

// ─────────────────────────────────────────────
// Update Driver Status (Online/Offline)
// ─────────────────────────────────────────────

export async function updateDriverStatusService(
    payload: JWTPayload,
    data: UpdateDriverStatusDTO
) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can update status");
    }

    const driver = await driverRepository.findDriverByUserId(payload.userId);

    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    if (!driver.isApproved) {
        throw new ForbiddenError(
            "Driver must be approved before going online"
        );
    }

    const updatedDriver = await driverRepository.updateDriverStatus(
        payload.userId,
        data.isOnline
    );

    return updatedDriver;
}

// ─────────────────────────────────────────────
// Get Nearby Drivers
// ─────────────────────────────────────────────

export async function getNearbyDriversService(data: GetNearbyDriversDTO) {
    const drivers = await driverRepository.findNearbyDrivers(
        data.latitude,
        data.longitude,
        data.radiusKm
    );

    return {
        drivers,
        count: drivers.length,
    };
}

// ─────────────────────────────────────────────
// Get Driver Stats
// ─────────────────────────────────────────────

export async function getDriverStatsService(data: GetDriverStatsDTO) {
    const driver = await driverRepository.findDriverById(data.driverId);

    if (!driver) {
        throw new NotFoundError("Driver not found");
    }

    const stats = await driverRepository.getDriverStats(data.driverId);

    return stats;
}

// ─────────────────────────────────────────────
// Get My Driver Stats (للسائق نفسه)
// ─────────────────────────────────────────────

export async function getMyDriverStatsService(payload: JWTPayload) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can access this endpoint");
    }

    const driver = await driverRepository.findDriverByUserId(payload.userId);

    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    const stats = await driverRepository.getDriverStats(driver.id);

    return stats;
}

// ─────────────────────────────────────────────
// Get Driver Reviews
// ─────────────────────────────────────────────

export async function getDriverReviewsService(data: GetDriverReviewsDTO) {
    const driver = await driverRepository.findDriverById(data.driverId);

    if (!driver) {
        throw new NotFoundError("Driver not found");
    }

    const result = await driverRepository.getDriverReviews(
        data.driverId,
        data.page,
        data.limit
    );

    return result;
}

// ─────────────────────────────────────────────
// Get My Driver Reviews (للسائق نفسه)
// ─────────────────────────────────────────────

export async function getMyDriverReviewsService(
    payload: JWTPayload,
    page: number = 1,
    limit: number = 10
) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can access this endpoint");
    }

    const driver = await driverRepository.findDriverByUserId(payload.userId);

    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    const result = await driverRepository.getDriverReviews(
        driver.id,
        page,
        limit
    );

    return result;
}

// ─────────────────────────────────────────────
// Get Driver Rides
// ─────────────────────────────────────────────

export async function getDriverRidesService(
    payload: JWTPayload,
    status?: string,
    page: number = 1,
    limit: number = 10
) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can access this endpoint");
    }

    const driver = await driverRepository.findDriverByUserId(payload.userId);

    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    const result = await driverRepository.getDriverRides(
        driver.id,
        status,
        page,
        limit
    );

    return result;
}
