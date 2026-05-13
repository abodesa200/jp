"use client";

import {
  UsersFilters,
  UsersPagination,
  UsersTable,
} from "@/modules/users/components";
import { useDeleteUser, useGetUsers } from "@/modules/users/hooks";
import type { UserRole } from "@/modules/users/types";
import { useState } from "react";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");

  const { data, isLoading } = useGetUsers({
    page,
    limit: 20,
    role: roleFilter || undefined,
  });

  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Authentication required");
      return;
    }

    deleteUser(
      { id, token },
      {
        onSuccess: () => {
          alert("User deleted successfully");
        },
        onError: (error) => {
          alert(`Failed to delete user: ${error.message}`);
        },
      }
    );
  };

  const handleRoleChange = (role: UserRole | "") => {
    setRoleFilter(role);
    setPage(1); // Reset to first page when filter changes
  };

  const users = data?.users || [];
  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage all platform users</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          + Add User
        </button>
      </div>

      <UsersFilters
        roleFilter={roleFilter}
        onRoleChange={handleRoleChange}
        total={total}
      />

      <UsersTable
        users={users}
        isLoading={isLoading}
        onDelete={handleDelete}
        isDeleting={isDeleting}
      />

      {totalPages > 1 && (
        <UsersPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
