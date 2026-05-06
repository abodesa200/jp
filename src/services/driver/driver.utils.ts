/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lng1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lng2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

/**
 * Filter drivers by radius from a given location
 */
export function filterDriversByRadius(
    drivers: Array<{
        id: number;
        latitude: number | null;
        longitude: number | null;
        [key: string]: any;
    }>,
    lat: number,
    lng: number,
    radius: number
): Array<{ distance: number;[key: string]: any }> {
    return drivers
        .filter((driver) => driver.latitude !== null && driver.longitude !== null)
        .map((driver) => ({
            ...driver,
            distance: calculateDistance(lat, lng, driver.latitude!, driver.longitude!),
        }))
        .filter((driver) => driver.distance <= radius)
        .sort((a, b) => a.distance - b.distance);
}
