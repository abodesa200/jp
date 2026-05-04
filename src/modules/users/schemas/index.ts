import { z } from "zod";

export const userRoleSchema = z.enum([
    "CLIENT",
    "ADMIN",
    "CUSTOMER_SUPPORT",
    "DRIVER",
]);

export const userSchema = z.object({
    id: z.number(),
    phone: z.string().min(1, "Phone is required"),
    name: z.string().nullable(),
    email: z.string().email("Invalid email").nullable(),
    role: userRoleSchema,
    isVerified: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
});

export const usersFiltersSchema = z.object({
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional(),
    role: z.union([userRoleSchema, z.literal("")]).optional(),
    search: z.string().optional(),
});

export const updateUserSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    email: z.string().email("Invalid email").optional(),
    role: userRoleSchema.optional(),
    isVerified: z.boolean().optional(),
});

export const createUserSchema = z.object({
    phone: z.string().min(10, "Phone must be at least 10 characters"),
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email").optional(),
    role: userRoleSchema.default("CLIENT"),
});
