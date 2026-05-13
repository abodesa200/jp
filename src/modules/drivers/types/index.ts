export interface DriverUser {
    id: number;
    phone: string;
    role: string;
    isVerified: boolean;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    passwordHash: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Driver {
    id: number;
    userId: number;
    licenseNumber: string;
    carModel: string;
    carPlate: string;
    carColor: string | null;
    carYear: number | null;
    isApproved: boolean;
    isOnline: boolean;
    latitude: number | null;
    longitude: number | null;
    lastLocationUpdate: string | null;
    rating: number;
    totalRides: number;
    createdAt: string;
    updatedAt: string;
    user: DriverUser;
    rides: unknown[];
    reviews: unknown[];
}

export interface DriversListParams {
    page?: number;
    limit?: number;
    isApproved?: boolean;
    isOnline?: boolean;
    search?: string;
}

export interface DriversListResponse {
    drivers: Driver[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
