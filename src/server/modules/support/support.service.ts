import {
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { supportRepository } from "./support.repository";
import {
    CreateSupportTicketDTO,
    GetSupportTicketsQuery,
    UpdateSupportTicketDTO,
} from "./support.schema";

type JWTPayload = {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
};

// ─────────────────────────────────────────────
// Create Support Ticket
// ─────────────────────────────────────────────

export async function createSupportTicketService(
    payload: JWTPayload,
    data: CreateSupportTicketDTO
) {
    const ticket = await supportRepository.createTicket(payload.userId, data);

    return {
        ticket,
        message: "Support ticket created successfully",
    };
}

// ─────────────────────────────────────────────
// Get User's Tickets
// ─────────────────────────────────────────────

export async function getUserTicketsService(
    payload: JWTPayload,
    query: GetSupportTicketsQuery
) {
    const skip = (query.page - 1) * query.limit;

    const { tickets, total } = await supportRepository.getUserTickets(
        payload.userId,
        {
            status: query.status,
            skip,
            take: query.limit,
        }
    );

    return {
        tickets,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

// ─────────────────────────────────────────────
// Get All Tickets (Admin/Support)
// ─────────────────────────────────────────────

export async function getAllTicketsService(
    payload: JWTPayload,
    query: GetSupportTicketsQuery
) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError(
            "Only admins and support staff can view all tickets"
        );
    }

    const skip = (query.page - 1) * query.limit;

    const { tickets, total } = await supportRepository.getAllTickets({
        status: query.status,
        skip,
        take: query.limit,
    });

    return {
        tickets,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

// ─────────────────────────────────────────────
// Get Ticket by ID
// ─────────────────────────────────────────────

export async function getTicketByIdService(
    payload: JWTPayload,
    ticketId: number
) {
    const ticket = await supportRepository.getTicketById(ticketId);

    if (!ticket) {
        throw new NotFoundError("Ticket not found");
    }

    // التحقق من الصلاحيات
    const isOwner = ticket.userId === payload.userId;
    const isStaff =
        payload.role === "ADMIN" || payload.role === "CUSTOMER_SUPPORT";

    if (!isOwner && !isStaff) {
        throw new ForbiddenError("You don't have access to this ticket");
    }

    return { ticket };
}

// ─────────────────────────────────────────────
// Update Ticket (Admin/Support)
// ─────────────────────────────────────────────

export async function updateTicketService(
    payload: JWTPayload,
    ticketId: number,
    data: UpdateSupportTicketDTO
) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError(
            "Only admins and support staff can update tickets"
        );
    }

    const ticket = await supportRepository.getTicketById(ticketId);

    if (!ticket) {
        throw new NotFoundError("Ticket not found");
    }

    const updatedTicket = await supportRepository.updateTicket(ticketId, data);

    return {
        ticket: updatedTicket,
        message: "Ticket updated successfully",
    };
}

// ─────────────────────────────────────────────
// Delete Ticket (Admin only)
// ─────────────────────────────────────────────

export async function deleteTicketService(
    payload: JWTPayload,
    ticketId: number
) {
    if (payload.role !== "ADMIN") {
        throw new ForbiddenError("Only admins can delete tickets");
    }

    const ticket = await supportRepository.getTicketById(ticketId);

    if (!ticket) {
        throw new NotFoundError("Ticket not found");
    }

    await supportRepository.deleteTicket(ticketId);

    return {
        message: "Ticket deleted successfully",
    };
}

// ─────────────────────────────────────────────
// Get Ticket Stats (Admin)
// ─────────────────────────────────────────────

export async function getTicketStatsService(payload: JWTPayload) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError(
            "Only admins and support staff can view ticket stats"
        );
    }

    const stats = await supportRepository.getTicketStats();

    return { stats };
}
