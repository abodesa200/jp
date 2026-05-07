import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { usersRepository } from "./users.repository";
import {
    CreateUserDTO,
    GetUsersQueryDTO,
    UpdateUserDTO,
} from "./users.schema";

type JWTPayload = {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
};

// ─────────────────────────────────────────────
// Get Users
// ─────────────────────────────────────────────

export async function getUsersService(
    payload: JWTPayload,
    query: GetUsersQueryDTO
) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const { users, total } = await usersRepository.getUsers(query);

    return {
        users,
        pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

// ─────────────────────────────────────────────
// Get User by ID
// ─────────────────────────────────────────────

export async function getUserByIdService(payload: JWTPayload, userId: number) {
    if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
        throw new ForbiddenError("Admin or support access required");
    }

    const user = await usersRepository.getUserById(userId);

    if (!user) {
        throw new NotFoundError("User not found");
    }

    return { user };
}

// ─────────────────────────────────────────────
// Create User
// ─────────────────────────────────────────────

export async function createUserService(
    payload: JWTPayload,
    data: CreateUserDTO
) {
    if (payload.role !== "ADMIN") {
        throw new ForbiddenError("Admin access required");
    }

    // Validate that at least phone or email is provided
    if (!data.phone && !data.email) {
        throw new ConflictError("Phone or email is required");
    }

    // Check if user already exists
    if (data.email) {
        const existing = await usersRepository.findByEmail(data.email);
        if (existing) {
            throw new ConflictError("Email already in use");
        }
    }

    if (data.phone) {
        const existing = await usersRepository.findByPhone(data.phone);
        if (existing) {
            throw new ConflictError("Phone already in use");
        }
    }

    // If creating a driver, validate driver info
    if (data.role === "DRIVER" && !data.driverInfo) {
        throw new ConflictError("Driver information is required for driver accounts");
    }

    const user = await usersRepository.createUser(data);

    return {
        user,
        message: "User created successfully",
    };
}

// ─────────────────────────────────────────────
// Update User
// ─────────────────────────────────────────────

export async function updateUserService(
    payload: JWTPayload,
    userId: number,
    data: UpdateUserDTO
) {
    if (payload.role !== "ADMIN") {
        throw new ForbiddenError("Admin access required");
    }

    const user = await usersRepository.getUserById(userId);

    if (!user) {
        throw new NotFoundError("User not found");
    }

    // Check if email is being changed and already exists
    if (data.email && data.email !== user.email) {
        const existing = await usersRepository.findByEmail(data.email);
        if (existing) {
            throw new ConflictError("Email already in use");
        }
    }

    // Check if phone is being changed and already exists
    if (data.phone && data.phone !== user.phone) {
        const existing = await usersRepository.findByPhone(data.phone);
        if (existing) {
            throw new ConflictError("Phone already in use");
        }
    }

    const updatedUser = await usersRepository.updateUser(userId, data);

    return {
        user: updatedUser,
        message: "User updated successfully",
    };
}

// ─────────────────────────────────────────────
// Delete User
// ─────────────────────────────────────────────

export async function deleteUserService(payload: JWTPayload, userId: number) {
    if (payload.role !== "ADMIN") {
        throw new ForbiddenError("Admin access required");
    }

    const user = await usersRepository.getUserById(userId);

    if (!user) {
        throw new NotFoundError("User not found");
    }

    // Prevent deleting yourself
    if (user.id === payload.userId) {
        throw new ForbiddenError("Cannot delete your own account");
    }

    await usersRepository.deleteUser(userId);

    return {
        message: "User deleted successfully",
    };
}
