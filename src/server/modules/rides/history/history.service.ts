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
// Export Ride History as CSV
// ─────────────────────────────────────────────

export async function exportRideHistoryService(
    payload: Payload,
    query: RideHistoryQueryDTO
) {
    const rides = await historyRepository.exportRideHistory(
        payload.userId,
        payload.role,
        query
    );

    // Build CSV
    const headers = [
        "ID",
        "Date",
        "Status",
        "Type",
        "Pickup",
        "Dropoff",
        "Fare",
        "Distance (km)",
        "Duration (min)",
        "Payment Method",
        "Payment Status",
        "Client",
        "Driver",
        "Car",
    ];

    const rows = rides.map((ride) => [
        ride.id,
        ride.createdAt.toISOString(),
        ride.status,
        ride.type,
        ride.pickupAddress ?? `${ride.pickupLat},${ride.pickupLng}`,
        ride.dropoffAddress ?? `${ride.dropoffLat},${ride.dropoffLng}`,
        ride.fare ?? "",
        ride.distance ?? "",
        ride.duration ? Math.round(ride.duration / 60) : "",
        ride.payment?.method ?? "",
        ride.payment?.status ?? "",
        ride.client?.name ?? "",
        ride.driver?.user?.name ?? "",
        ride.driver?.carModel ?? "",
    ]);

    const csv = [headers, ...rows]
        .map((row) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

    return csv;
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
