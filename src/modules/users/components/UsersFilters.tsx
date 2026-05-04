"use client";

import type { UserRole } from "../types";

interface UsersFiltersProps {
    roleFilter: UserRole | "";
    onRoleChange: (role: UserRole | "") => void;
    total: number;
}

export function UsersFilters({
    roleFilter,
    onRoleChange,
    total,
}: UsersFiltersProps) {
    return (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="shrink-0">
                    <label
                        htmlFor="role-filter"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Role
                    </label>
                    <select
                        id="role-filter"
                        value={roleFilter}
                        onChange={(e) => onRoleChange(e.target.value as UserRole | "")}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                        <option value="">All Roles</option>
                        <option value="CLIENT">Client</option>
                        <option value="DRIVER">Driver</option>
                        <option value="ADMIN">Admin</option>
                        <option value="CUSTOMER_SUPPORT">Support</option>
                    </select>
                </div>

                <div className="flex-1"></div>

                <div className="text-sm text-gray-600">
                    Total: <span className="font-semibold text-gray-900">{total}</span>{" "}
                    users
                </div>
            </div>
        </div>
    );
}
