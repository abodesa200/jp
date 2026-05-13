import { Ride, RidesListParams, RidesListResponse } from "../types";

export class RidesService {
    private static getAuthHeaders() {
        const token = localStorage.getItem("token");
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    }

    static async getRides(params: RidesListParams): Promise<RidesListResponse> {
        const searchParams = new URLSearchParams({
            page: (params.page || 1).toString(),
            limit: (params.limit || 20).toString(),
            ...(params.status && { status: params.status }),
            ...(params.type && { type: params.type }),
            ...(params.search && { search: params.search }),
        });

        const response = await fetch(`/api/admin/rides?${searchParams}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch rides");
        }

        return response.json();
    }

    static async getRide(id: number): Promise<Ride> {
        const response = await fetch(`/api/admin/rides/${id}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch ride");
        }

        const json = await response.json();
        return json.ride;
    }

    static async deleteRide(id: number): Promise<void> {
        const response = await fetch(`/api/admin/rides/${id}`, {
            method: "DELETE",
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to delete ride");
        }
    }

    static async cancelRide(id: number): Promise<Ride> {
        const response = await fetch(`/api/rides/${id}/cancel`, {
            method: "POST",
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to cancel ride");
        }

        const json = await response.json();
        return json.data;
    }
}
