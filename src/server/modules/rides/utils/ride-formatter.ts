/**
 * Ride Response Formatter
 * Format database entities to API responses
 */

import { RideDetails } from "../ride.types";

export function formatRideDetails(ride: any): RideDetails {
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
