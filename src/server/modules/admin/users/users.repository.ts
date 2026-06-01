import { prisma } from "@/lib/prisma";
import { CreateUserDTO, GetUsersQueryDTO, UpdateUserDTO } from "./users.schema";

// ─────────────────────────────────────────────
// Get Users
// ─────────────────────────────────────────────

export async function getUsers(query: GetUsersQueryDTO) {
    const skip = (query.page - 1) * query.limit;

    const where: any = {};

    if (query.role) {
        where.role = query.role;
    }

    if (query.search) {
        where.OR = [
            { name: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
            { phone: { contains: query.search } },
        ];
    }

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: query.limit,
            orderBy: { createdAt: "desc" },
            include: {
                driver: true,
            },
        }),
        prisma.user.count({ where }),
    ]);

    return { users, total };
}

// ─────────────────────────────────────────────
// Get User by ID
// ─────────────────────────────────────────────

export async function getUserById(userId: number) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: {
            driver: true,
            rides: {
                take: 10,
                orderBy: { createdAt: "desc" },
            },
            reviews: {
                take: 10,
                orderBy: { createdAt: "desc" },
            },
            tickets: {
                take: 10,
                orderBy: { createdAt: "desc" },
            },
        },
    });
}

// ─────────────────────────────────────────────
// Create User
// ─────────────────────────────────────────────

export async function createUser(data: CreateUserDTO) {
    return prisma.user.create({
        data: {
            phone: data.phone,
            email: data.email,
            name: data.name,
            role: data.role,
            passwordHash: data.passwordHash,
            isVerified: true, // Admin-created users are auto-verified
            driver: data.driverInfo
                ? {
                    create: {
                        licenseNumber: data.driverInfo.licenseNumber,
                        carModel: data.driverInfo.carModel,
                        carPlate: data.driverInfo.carPlate,
                        carColor: data.driverInfo.carColor,
                        carYear: data.driverInfo.carYear,
                        serviceType: data.driverInfo.serviceType ?? "STANDARD",
                        isApproved: false, // Needs approval
                    },
                }
                : undefined,
        },
        include: {
            driver: true,
        },
    });
}

// ─────────────────────────────────────────────
// Update User
// ─────────────────────────────────────────────

export async function updateUser(userId: number, data: UpdateUserDTO) {
    return prisma.user.update({
        where: { id: userId },
        data,
        include: {
            driver: true,
        },
    });
}

// ─────────────────────────────────────────────
// Delete User
// ─────────────────────────────────────────────

export async function deleteUser(userId: number) {
    return prisma.user.delete({
        where: { id: userId },
    });
}

// ─────────────────────────────────────────────
// Check if email exists
// ─────────────────────────────────────────────

export async function findByEmail(email: string) {
    return prisma.user.findUnique({
        where: { email },
    });
}

// ─────────────────────────────────────────────
// Check if phone exists
// ─────────────────────────────────────────────

export async function findByPhone(phone: string) {
    return prisma.user.findUnique({
        where: { phone },
    });
}

export const usersRepository = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    findByEmail,
    findByPhone,
};
