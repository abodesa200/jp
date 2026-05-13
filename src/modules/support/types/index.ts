export interface SupportTicket {
    id: number;
    userId: number;
    subject: string;
    message: string;
    isResolved: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
        id: number;
        name: string | null;
        email: string | null;
        phone: string | null;
        role: string;
    };
}

export interface SupportTicketsListParams {
    page?: number;
    limit?: number;
    status?: "open" | "resolved";
}

export interface SupportTicketsListResponse {
    tickets: SupportTicket[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
