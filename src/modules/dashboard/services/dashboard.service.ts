import { DashboardStats } from "../types";

export class DashboardService {
    private static getAuthHeaders() {
        const token = localStorage.getItem("token");
        return {
            Authorization: `Bearer ${token}`,
        };
    }

    static async getStats(): Promise<DashboardStats> {
        const response = await fetch("/api/admin/stats", {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch dashboard stats");
        }

        return response.json();
    }
}
