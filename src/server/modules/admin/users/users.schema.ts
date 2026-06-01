import { z } from "zod";

// ─────────────────────────────────────────────
// Get Users Query
// ─────────────────────────────────────────────

export const getUsersQuerySchema = z.object({
    role: z
        .enum(["CLIENT", "DRIVER", "ADMIN", "CUSTOMER_SUPPORT"])
        .optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    search: z.string().optional(),
});

export type GetUsersQueryDTO = z.infer<typeof getUsersQuerySchema>;

// ─────────────────────────────────────────────
// Create User
// ─────────────────────────────────────────────

export const createUserSchema = z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    name: z.string().min(2).max(100).optional(),
    role: z
        .enum(["CLIENT", "DRIVER", "ADMIN", "CUSTOMER_SUPPORT"])
        .default("CLIENT"),
    passwordHash: z.string().optional(), // For ADMIN only
    driverInfo: z
        .object({
            licenseNumber: z.string().min(5),
            carModel: z.string().min(2),
            carPlate: z.string().min(2),
            carColor: z.string().optional(),
            carYear: z.number().int().min(1990).max(2030).optional(),
            serviceType: z.enum(["STANDARD", "VIP", "VAN"]).default("STANDARD"),
        })
        .optional(),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;

// ─────────────────────────────────────────────
// Update User
// ─────────────────────────────────────────────

export const updateUserSchema = z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    name: z.string().min(2).max(100).optional(),
    role: z
        .enum(["CLIENT", "DRIVER", "ADMIN", "CUSTOMER_SUPPORT"])
        .optional(),
    isVerified: z.boolean().optional(),
    avatarUrl: z.string().url().optional(),
});

export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
