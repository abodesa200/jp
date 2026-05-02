import { Driver, DriversListParams, DriversListResponse } from "../types";

export class DriversService {
    private static getAuthHeaders() {
        const token = localStorage.getItem("token");
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    }

    static async getDrivers(params: DriversListParams): Promise<DriversListResponse> {
        const searchParams = new URLSearchParams({
            page: (params.page || 1).toString(),
            limit: (params.limit || 20).toString(),
            role: "DRIVER",
            ...(params.approved !== undefined && { approved: params.approved.toString() }),
            ...(params.search && { search: params.search }),
        });

        const response = await fetch(`/api/admin/users?${searchParams}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch drivers");
        }

        return response.json();
    }

    static async getDriver(id: string): Promise<Driver> {
        const response = await fetch(`/api/admin/users/${id}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch driver");
        }

        return response.json();
    }

    static async updateDriver(id: string, data: Partial<Driver>): Promise<Driver> {
        const response = await fetch(`/api/admin/drivers/${id}`, {
            method: "PATCH",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error("Failed to update driver");
        }

        return response.json();
    }

    static async deleteDriver(id: string): Promise<void> {
        const response = await fetch(`/api/admin/drivers/${id}`, {
            method: "DELETE",
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to delete driver");
        }
    }

    static async toggleApproval(id: string, currentStatus: boolean): Promise<Driver> {
        return this.updateDriver(id, { isApproved: !currentStatus });
    }
}
