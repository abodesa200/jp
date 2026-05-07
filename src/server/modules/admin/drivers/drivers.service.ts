import {
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { driversRepository } from "./drivers.repository";
import { GetDriversQueryDTO, UpdateDriverDTO } from "./drivers.schema";

type JWTPayload = {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
};

// ─────────────────────────────────────────────
// Get Drivers
// ─────────────────────────────────────────────

export async function getDriversService(
    payload: JWTPayload,
    query: GetDriversQueryDTO
) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const { drivers, total } = await driversRepository.getDrivers(query);

    return {
        drivers,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

// ─────────────────────────────────────────────
// Get Driver by ID
// ─────────────────────────────────────────────

export async function getDriverByIdService(
    payload: JWTPayload,
    driverId: number
) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const driver = await driversRepository.getDriverById(driverId);

    if (!driver) {
        throw new NotFoundError("Driver not found");
    }

    return { driver };
}

// ─────────────────────────────────────────────
// Update Driver (Approve/Reject)
// ─────────────────────────────────────────────

export async function updateDriverService(
    payload: JWTPayload,
    driverId: number,
    data: UpdateDriverDTO
) {
    if (payload.role !== "ADMIN") {
        throw new ForbiddenError("Admin access required");
    }

    const driver = await driversRepository.getDriverById(driverId);

    if (!driver) {
        throw new NotFoundError("Driver not found");
    }

    const updatedDriver = await driversRepository.updateDriver(driverId, data);

    return {
        driver: updatedDriver,
        message: "Driver updated successfully",
    };
}

// ─────────────────────────────────────────────
// Delete Driver
// ─────────────────────────────────────────────

export async function deleteDriverService(
    payload: JWTPayload,
    driverId: number
) {
    if (payload.role !== "ADMIN") {
        throw new ForbiddenError("Admin access required");
    }

    const driver = await driversRepository.getDriverById(driverId);

    if (!driver) {
        throw new NotFoundError("Driver not found");
    }

    await driversRepository.deleteDriver(driverId);

    return {
        message: "Driver deleted successfully",
    };
}

// ─────────────────────────────────────────────
// Get Pending Drivers (Need Approval)
// ─────────────────────────────────────────────

export async function getPendingDriversService(payload: JWTPayload) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const drivers = await driversRepository.getPendingDrivers();

    return { drivers };
}
