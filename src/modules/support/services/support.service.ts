import { SupportTicketsListParams, SupportTicketsListResponse } from "../types";

export class SupportService {
    private static getAuthHeaders() {
        const token = localStorage.getItem("token");
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    }

    static async getTickets(params: SupportTicketsListParams): Promise<SupportTicketsListResponse> {
        const searchParams = new URLSearchParams({
            page: (params.page || 1).toString(),
            limit: (params.limit || 20).toString(),
            ...(params.isResolved !== undefined && { isResolved: params.isResolved.toString() }),
        });

        const response = await fetch(`/api/admin/support/tickets?${searchParams}`, {
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error("Failed to fetch support tickets");
        }

        const json = await response.json();
        return json.data;
    }

    static async resolveTicket(ticketId: number): Promise<void> {
        const response = await fetch(`/api/support/tickets/${ticketId}`, {
            method: "PATCH",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ isResolved: true }),
        });

        if (!response.ok) {
            const json = await response.json();
            throw new Error(json.error || "Failed to resolve ticket");
        }
    }
}
