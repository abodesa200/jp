import { ForbiddenError, NotFoundError } from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import {
    CreateSupportTicketDTO,
    GetSupportTicketsQueryDTO,
    UpdateSupportTicketDTO,
} from "./support.schema";

type Payload = {
    userId: number;
    role: string;
};

// ─────────────────────────────────────────────
// Create Support Ticket
// ─────────────────────────────────────────────

export async function createSupportTicketService(payload: Payload, data: CreateSupportTicketDTO) {
    const ticket = await prisma.supportTicket.create({
        data: {
            userId: payload.userId,
            subject: data.subject,
            message: data.message,
            isResolved: false,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
        },
    });

    // TODO: Send notification to admin about new ticket
    // await notifyAdmins("New support ticket created", ticket);

    return ticket;
}

// ─────────────────────────────────────────────
// Get My Support Tickets
// ─────────────────────────────────────────────

export async function getMySupportTicketsService(payload: Payload, query: GetSupportTicketsQueryDTO) {
    const { isResolved, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {
        userId: payload.userId,
    };

    if (isResolved !== undefined) {
        where.isResolved = isResolved;
    }

    const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        prisma.supportTicket.count({ where }),
    ]);

    return {
        tickets,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    };
}

// ─────────────────────────────────────────────
// Get Support Ticket by ID
// ─────────────────────────────────────────────

export async function getSupportTicketByIdService(payload: Payload, ticketId: number) {
    const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                },
            },
        },
    });

    if (!ticket) {
        throw new NotFoundError("Support ticket not found");
    }

    // User can only view their own tickets unless they are admin
    if (payload.role !== "ADMIN" && ticket.userId !== payload.userId) {
        throw new ForbiddenError("You can only view your own support tickets");
    }

    return ticket;
}

// ─────────────────────────────────────────────
// Update Support Ticket
// ─────────────────────────────────────────────

export async function updateSupportTicketService(
    payload: Payload,
    ticketId: number,
    data: UpdateSupportTicketDTO
) {
    const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
    });

    if (!ticket) {
        throw new NotFoundError("Support ticket not found");
    }

    // User can only update their own tickets unless they are admin
    if (payload.role !== "ADMIN" && ticket.userId !== payload.userId) {
        throw new ForbiddenError("You can only update your own support tickets");
    }

    const updateData: any = {};

    if (data.message !== undefined) {
        updateData.message = data.message;
    }

    // Only admin can mark as resolved
    if (data.isResolved !== undefined) {
        if (payload.role !== "ADMIN") {
            throw new ForbiddenError("Only admins can mark tickets as resolved");
        }
        updateData.isResolved = data.isResolved;
    }

    const updatedTicket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: updateData,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });

    // TODO: Send notification to user if ticket was resolved
    // if (data.isResolved && !ticket.isResolved) {
    //     await notifyUser(ticket.userId, "Your support ticket has been resolved");
    // }

    return updatedTicket;
}

// ─────────────────────────────────────────────
// Get All Support Tickets (Admin)
// ─────────────────────────────────────────────

export async function getAllSupportTicketsService(query: GetSupportTicketsQueryDTO) {
    const { isResolved, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (isResolved !== undefined) {
        where.isResolved = isResolved;
    }

    const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                    },
                },
            },
        }),
        prisma.supportTicket.count({ where }),
    ]);

    return {
        tickets,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    };
}
