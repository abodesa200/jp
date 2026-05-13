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
            ...(params.isApproved !== undefined && { isApproved: params.isApproved.toString() }),
            ...(params.isOnline !== undefined && { isOnline: params.isOnline.toString() }),
            ...(params.search && { search: params.search }),
        });

        const response = await fetch(`/api/admin/drivers?${searchParams}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch drivers");
        }

        const json = await response.json();
        return {
            drivers: json.drivers ?? [],
            pagination: json.pagination ?? {
                page: params.page || 1,
                limit: params.limit || 20,
                total: 0,
                totalPages: 0,
            },
        };
    }

    static async getDriver(id: number): Promise<Driver> {
        const response = await fetch(`/api/admin/drivers/${id}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch driver");
        }

        const json = await response.json();
        return json.driver;
    }

    static async updateDriver(id: number, data: Partial<Driver>): Promise<Driver> {
        const response = await fetch(`/api/admin/drivers/${id}`, {
            method: "PATCH",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error("Failed to update driver");
        }

        const json = await response.json();
        return json.driver;
    }

    static async deleteDriver(id: number): Promise<void> {
        const response = await fetch(`/api/admin/drivers/${id}`, {
            method: "DELETE",
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to delete driver");
        }
    }

    static async toggleApproval(id: number, currentStatus: boolean): Promise<Driver> {
        return this.updateDriver(id, { isApproved: !currentStatus });
    }
}
