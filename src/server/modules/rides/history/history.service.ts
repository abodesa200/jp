import * as historyRepository from "./history.repository";
import { RideHistoryQueryDTO } from "./history.schema";

type Payload = {
    userId: number;
    role: string;
};

// ─────────────────────────────────────────────
// Get Ride History
// ─────────────────────────────────────────────

export async function getRideHistoryService(
    payload: Payload,
    query: RideHistoryQueryDTO
) {
    const { rides, total } = await historyRepository.getRideHistory(
        payload.userId,
        payload.role,
        query
    );

    return {
        rides,
        pagination: {
            total,
            page: query.page,
            limit: query.limit,
            pages: Math.ceil(total / query.limit),
        },
    };
}



// ─────────────────────────────────────────────
// Admin Rides Report
// ─────────────────────────────────────────────

export async function getAdminRidesReportService(query: RideHistoryQueryDTO) {
    const { rides, total, aggregates } =
        await historyRepository.getAdminRidesReport(query);

    return {
        rides,
        pagination: {
            total,
            page: query.page,
            limit: query.limit,
            pages: Math.ceil(total / query.limit),
        },
        summary: {
            totalRides: total,
            completedRides: aggregates._count.id,
            totalRevenue: aggregates._sum.fare ?? 0,
            totalDistance: aggregates._sum.distance ?? 0,
            averageFare: aggregates._avg.fare ?? 0,
            averageDistance: aggregates._avg.distance ?? 0,
            averageDuration: aggregates._avg.duration
                ? Math.round(aggregates._avg.duration / 60)
                : 0,
        },
    };
}
