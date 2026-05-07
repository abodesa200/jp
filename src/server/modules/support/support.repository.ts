import { prisma } from "@/lib/prisma";
import { CreateSupportTicketDTO } from "./support.schema";

// ─────────────────────────────────────────────
// Create Support Ticket
// ─────────────────────────────────────────────

export async function createTicket(userId: number, data: CreateSupportTicketDTO) {
    return prisma.supportTicket.create({
        data: {
            userId,
            subject: data.subject,
            message: data.message,
        },
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
}

// ─────────────────────────────────────────────
// Get User Tickets
// ─────────────────────────────────────────────

export async function getUserTickets(
    userId: number,
    options: {
        status?: "all" | "open" | "resolved";
        skip?: number;
        take?: number;
    }
) {
    const where: any = { userId };

    if (options.status === "open") {
        where.isResolved = false;
    } else if (options.status === "resolved") {
        where.isResolved = true;
    }

    const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
            where,
            skip: options.skip,
            take: options.take,
            orderBy: { createdAt: "desc" },
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
        }),
        prisma.supportTicket.count({ where }),
    ]);

    return { tickets, total };
}

// ─────────────────────────────────────────────
// Get All Tickets (Admin/Support)
// ─────────────────────────────────────────────

export async function getAllTickets(options: {
    status?: "all" | "open" | "resolved";
    skip?: number;
    take?: number;
}) {
    const where: any = {};

    if (options.status === "open") {
        where.isResolved = false;
    } else if (options.status === "resolved") {
        where.isResolved = true;
    }

    const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
            where,
            skip: options.skip,
            take: options.take,
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

    return { tickets, total };
}

// ─────────────────────────────────────────────
// Get Ticket by ID
// ─────────────────────────────────────────────

export async function getTicketById(ticketId: number) {
    return prisma.supportTicket.findUnique({
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
}

// ─────────────────────────────────────────────
// Update Ticket
// ─────────────────────────────────────────────

export async function updateTicket(
    ticketId: number,
    data: { isResolved?: boolean }
) {
    return prisma.supportTicket.update({
        where: { id: ticketId },
        data,
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
}

// ─────────────────────────────────────────────
// Delete Ticket
// ─────────────────────────────────────────────

export async function deleteTicket(ticketId: number) {
    return prisma.supportTicket.delete({
        where: { id: ticketId },
    });
}

// ─────────────────────────────────────────────
// Get Ticket Stats (Admin)
// ─────────────────────────────────────────────

export async function getTicketStats() {
    const [total, open, resolved] = await Promise.all([
        prisma.supportTicket.count(),
        prisma.supportTicket.count({ where: { isResolved: false } }),
        prisma.supportTicket.count({ where: { isResolved: true } }),
    ]);

    return {
        total,
        open,
        resolved,
    };
}

export const supportRepository = {
    createTicket,
    getUserTickets,
    getAllTickets,
    getTicketById,
    updateTicket,
    deleteTicket,
    getTicketStats,
};
