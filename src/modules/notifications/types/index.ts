export type UserRole = "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";

export interface SendNotificationData {
    title: string;
    message: string;
    userIds?: number[];
    role?: UserRole;
}

export interface SendNotificationResult {
    success: boolean;
    sentTo: number;
    message: string;
}
