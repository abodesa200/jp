/**
 * Ride Calculation Utilities
 * Pure functions for distance, fare, and duration calculations
 */

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth radius in km
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

/**
 * Calculate fare based on distance
 */
export function calculateFare(distance: number): number {
    const baseFare = 5;
    const perKm = 2;
    return baseFare + distance * perKm;
}

/**
 * Calculate estimated duration based on distance
 */
export function calculateEstimatedDuration(distance: number): number {
    const avgSpeed = 40; // km/h
    return Math.ceil((distance / avgSpeed) * 60); // minutes
}
