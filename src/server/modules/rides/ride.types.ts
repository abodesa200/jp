/**
 * Ride Module Types
 */

export interface RideLocation {
    lat: number;
    lng: number;
    address: string;
}

export interface RideDetails {
    id: number;
    status: string;
    pickup: RideLocation;
    dropoff: RideLocation;
    systemFare: number;
    distance: number;
    estimatedDuration: number;
    type: string;
    requestedAt: Date;
}

export interface CreateRideInput {
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
    dropoffLat: number;
    dropoffLng: number;
    dropoffAddress: string;
    type: "STANDARD" | "CARPOOLING";
    maxPassengers?: number;
}

export interface GetRidesQuery {
    status?: string;
    page?: number;
    limit?: number;
}

export interface NegotiateRideInput {
    amount: number;
    message?: string;
}

export interface RespondToNegotiationInput {
    action: "accept" | "reject";
}
