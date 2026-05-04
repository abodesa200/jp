import type { UserRole } from "../types";

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/**
 * User roles with labels and colors
 */
export const USER_ROLES: Record<
    UserRole,
    { label: string; color: string; description: string }
> = {
    CLIENT: {
        label: "Client",
        color: "blue",
        description: "Regular user who can book rides",
    },
    DRIVER: {
        label: "Driver",
        color: "green",
        description: "Driver who can accept and complete rides",
    },
    ADMIN: {
        label: "Admin",
        color: "red",
        description: "Administrator with full access",
    },
    CUSTOMER_SUPPORT: {
        label: "Support",
        color: "purple",
        description: "Customer support representative",
    },
};

/**
 * User role options for dropdowns
 */
export const USER_ROLE_OPTIONS = Object.entries(USER_ROLES).map(
    ([value, { label, description }]) => ({
        value,
        label,
        description,
    })
);

/**
 * Query keys for React Query
 */
export const QUERY_KEYS = {
    users: (filters?: Record<string, unknown>) => ["users", filters],
    user: (id: number) => ["user", id],
} as const;
