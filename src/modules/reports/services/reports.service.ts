import { DriverStats, ReportFilters, RevenueStats, RideStats, UserStats } from "../types";

export class ReportsService {
    private static getAuthHeaders() {
        const token = localStorage.getItem("token");
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    }

    private static buildQuery(filters: ReportFilters): string {
        const params = new URLSearchParams();
        if (filters.startDate) params.set("startDate", filters.startDate);
        if (filters.endDate) params.set("endDate", filters.endDate);
        return params.toString();
    }

    static async getRideStats(filters: ReportFilters = {}): Promise<RideStats> {
        const query = this.buildQuery(filters);
        const response = await fetch(`/api/admin/stats/rides${query ? `?${query}` : ""}`, {
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch ride statistics");
        const json = await response.json();
        return json.data;
    }

    static async getRevenueStats(filters: ReportFilters = {}): Promise<RevenueStats> {
        const query = this.buildQuery(filters);
        const response = await fetch(`/api/admin/stats/revenue${query ? `?${query}` : ""}`, {
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch revenue statistics");
        const json = await response.json();
        return json.data;
    }

    static async getDriverStats(): Promise<DriverStats> {
        const response = await fetch("/api/admin/stats/drivers", {
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch driver statistics");
        const json = await response.json();
        return json.data;
    }

    static async getUserStats(filters: ReportFilters = {}): Promise<UserStats> {
        const query = this.buildQuery(filters);
        const response = await fetch(`/api/admin/stats/users${query ? `?${query}` : ""}`, {
            headers: this.getAuthHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch user statistics");
        const json = await response.json();
        return json.data;
    }
}
