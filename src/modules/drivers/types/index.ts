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
    rating: number;
    totalRides: number;
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: number;
    phone: string;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
    isVerified: boolean;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    passwordHash: string | null;
    createdAt: string;
    updatedAt: string;
    driver: Driver | null;
}

export interface DriversListParams {
    page?: number;
    limit?: number;
    approved?: boolean;
    search?: string;
}

export interface DriversListResponse {
    users: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}