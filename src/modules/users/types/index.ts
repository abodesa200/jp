export type UserRole = "CLIENT" | "ADMIN" | "CUSTOMER_SUPPORT" | "DRIVER";

export interface User {
    id: number;
    phone: string;
    name: string | null;
    email: string | null;
    role: UserRole;
    isVerified: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface UsersFilters {
    page?: number;
    limit?: number;
    role?: UserRole | "";
    search?: string;
}

export interface UsersResponse {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface DeleteUserParams {
    id: number;
    token: string;
}

export interface UpdateUserParams {
    id: number;
    data: Partial<Pick<User, "name" | "email" | "role" | "isVerified">>;
    token: string;
}
