import { SendNotificationData, SendNotificationResult } from "../types";

export class NotificationsService {
    private static getAuthHeaders() {
        const token = localStorage.getItem("token");
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    }

    static async sendNotification(data: SendNotificationData): Promise<SendNotificationResult> {
        const response = await fetch("/api/admin/notifications/send", {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const json = await response.json();
            throw new Error(json.error || "Failed to send notification");
        }

        const json = await response.json();
        return json.data;
    }
}
