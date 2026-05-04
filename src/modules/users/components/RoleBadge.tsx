import type { UserRole } from "../types";

interface RoleBadgeProps {
    role: UserRole;
}

const roleConfig: Record<
    UserRole,
    { label: string; className: string }
> = {
    CLIENT: {
        label: "Client",
        className: "bg-blue-100 text-blue-800",
    },
    ADMIN: {
        label: "Admin",
        className: "bg-red-100 text-red-800",
    },
    CUSTOMER_SUPPORT: {
        label: "Support",
        className: "bg-purple-100 text-purple-800",
    },
    DRIVER: {
        label: "Driver",
        className: "bg-green-100 text-green-800",
    },
};

export function RoleBadge({ role }: RoleBadgeProps) {
    const config = roleConfig[role] || {
        label: role,
        className: "bg-gray-100 text-gray-800",
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}
        >
            {config.label}
        </span>
    );
}
