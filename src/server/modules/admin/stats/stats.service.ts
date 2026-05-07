import { ForbiddenError } from "@/server/core/http/http-errors";
import { statsRepository } from "./stats.repository";

type JWTPayload = {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
};

// ─────────────────────────────────────────────
// Get Dashboard Stats
// ─────────────────────────────────────────────

export async function getDashboardStatsService(payload: JWTPayload) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const stats = await statsRepository.getDashboardStats();

    return { stats };
}

// ─────────────────────────────────────────────
// Get User Stats
// ─────────────────────────────────────────────

export async function getUserStatsService(payload: JWTPayload) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const stats = await statsRepository.getUserStats();

    return { stats };
}

// ─────────────────────────────────────────────
// Get Driver Stats
// ─────────────────────────────────────────────

export async function getDriverStatsService(payload: JWTPayload) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const stats = await statsRepository.getDriverStats();

    return { stats };
}

// ─────────────────────────────────────────────
// Get Ride Stats
// ─────────────────────────────────────────────

export async function getRideStatsService(payload: JWTPayload) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const stats = await statsRepository.getRideStats();

    return { stats };
}

// ─────────────────────────────────────────────
// Get Revenue Stats
// ─────────────────────────────────────────────

export async function getRevenueStatsService(payload: JWTPayload) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const stats = await statsRepository.getRevenueStats();

    return { stats };
}
