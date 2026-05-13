export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentMethod = "CASH" | "CARD" | "WALLET";

export interface Payment {
    id: number;
    rideId: number;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId: string | null;
    createdAt: string;
    updatedAt: string;
    ride: {
        id: number;
        clientId: number;
        driverId: number | null;
        pickupAddress: string | null;
        dropoffAddress: string | null;
        completedAt: string | null;
        client: {
            id: number;
            name: string | null;
            email: string | null;
        };
        driver: {
            id: number;
            userId: number;
            user: {
                name: string | null;
                email: string | null;
            };
        } | null;
    };
}

export interface PaymentsListParams {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
}

export interface PaymentsListResponse {
    payments: Payment[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
