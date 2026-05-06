import { PaymentsListParams, PaymentsListResponse } from "../types";

export class PaymentsService {
    private static getAuthHeaders() {
        const token = localStorage.getItem("token");
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    }

    static async getPayments(params: PaymentsListParams): Promise<PaymentsListResponse> {
        const searchParams = new URLSearchParams({
            page: (params.page || 1).toString(),
            limit: (params.limit || 20).toString(),
            ...(params.status && { status: params.status }),
        });

        const response = await fetch(`/api/admin/payments?${searchParams}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch payments");
        }

        const json = await response.json();
        return json.data;
    }
}
