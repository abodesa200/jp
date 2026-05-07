// ─────────────────────────────────────────────
// Distance Calculation (Haversine Formula)
// ─────────────────────────────────────────────

export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ─────────────────────────────────────────────
// Fare Calculation
// ─────────────────────────────────────────────

export function calculateFare(distanceKm: number): number {
    const baseFare = 5; // سعر البداية
    const perKm = 2; // سعر الكيلومتر
    const minFare = 5; // أقل سعر

    const fare = baseFare + distanceKm * perKm;
    return Math.max(fare, minFare);
}

// ─────────────────────────────────────────────
// Estimated Duration Calculation
// ─────────────────────────────────────────────

export function calculateEstimatedDuration(distanceKm: number): number {
    const averageSpeed = 40; // km/h
    return Math.ceil((distanceKm / averageSpeed) * 60); // minutes
}

// ─────────────────────────────────────────────
// Ride Mapper (DTO)
// ─────────────────────────────────────────────

export function mapRide(ride: any) {
    return {
        id: ride.id,
        status: ride.status,

        pickup: {
            lat: ride.pickupLat,
            lng: ride.pickupLng,
            address: ride.pickupAddress,
        },

        dropoff: {
            lat: ride.dropoffLat,
            lng: ride.dropoffLng,
            address: ride.dropoffAddress,
        },

        systemFare: ride.systemFare,
        distance: ride.distance,
        estimatedDuration: ride.duration,
        type: ride.type,
        requestedAt: ride.requestedAt,
    };
}
