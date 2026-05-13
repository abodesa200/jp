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
        let payload = { ...data };

        if (!payload.userId && !payload.userIds) {
            const userIds = await this.fetchUserIds(payload.role);
            payload = {
                ...payload,
                userIds,
            };
            delete payload.role;
        }

        const response = await fetch("/api/admin/notifications/send", {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const json = await response.json();
            throw new Error(json.error || "Failed to send notification");
        }

        const json = await response.json();
        if (json.count !== undefined) {
            return {
                sentTo: json.count,
                message: json.message ?? "Notifications sent successfully",
            };
        }

        return {
            sentTo: 1,
            message: json.message ?? "Notification sent successfully",
        };
    }

    private static async fetchUserIds(role?: string): Promise<number[]> {
        const ids: number[] = [];
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages) {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "100",
                ...(role ? { role } : {}),
            });

            const response = await fetch(`/api/admin/users?${params}`, {
                headers: this.getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch users for notification target");
            }

            const json = await response.json();
            const users = json.users ?? [];
            totalPages = json.pagination?.totalPages ?? 1;

            ids.push(...users.map((user: { id: number }) => user.id));
            page += 1;
        }

        if (ids.length === 0) {
            throw new Error("No users found for selected target");
        }

        return ids;
    }
}
