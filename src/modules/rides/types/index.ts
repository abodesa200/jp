export interface Ride {
    id: string;
    status: RideStatus;
    type: RideType;
    fare: number | null;
    distance: number | null;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    pickupAddress: string | null;
    dropoffAddress: string | null;
    createdAt: string;
    updatedAt: string;
    client: {
        id: number;
        name: string | null;
        phone: string;
        email: string | null;
    };
    driver: {
        id: string;
        licenseNumber: string;
        carModel: string;
        carPlate: string;
        rating: number;
        user: {
            id: number;
            name: string | null;
            phone: string;
        };
    } | null;
}

export type RideStatus =
    | "REQUESTED"
    | "ACCEPTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";

export type RideType = "STANDARD" | "CARPOOLING";

export interface RidesListParams {
    page?: number;
    limit?: number;
    status?: RideStatus;
    type?: RideType;
    search?: string;
}

export interface RidesListResponse {
    rides: Ride[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
