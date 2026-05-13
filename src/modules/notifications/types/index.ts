export type UserRole = "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";

export interface SendNotificationData {
    title: string;
    message: string;
    userId?: number;
    userIds?: number[];
    role?: UserRole;
}

export interface SendNotificationResult {
    sentTo: number;
    message: string;
}
