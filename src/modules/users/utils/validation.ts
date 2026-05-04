import { z } from "zod";
import {
    createUserSchema,
    updateUserSchema,
    userSchema,
    usersFiltersSchema,
} from "../schemas";

/**
 * Validate user data
 */
export function validateUser(data: unknown) {
    return userSchema.safeParse(data);
}

/**
 * Validate users filters
 */
export function validateUsersFilters(data: unknown) {
    return usersFiltersSchema.safeParse(data);
}

/**
 * Validate update user data
 */
export function validateUpdateUser(data: unknown) {
    return updateUserSchema.safeParse(data);
}

/**
 * Validate create user data
 */
export function validateCreateUser(data: unknown) {
    return createUserSchema.safeParse(data);
}

/**
 * Get validation error messages
 */
export function getValidationErrors(error: z.ZodError) {
    return error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
    }));
}
