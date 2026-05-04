import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DeleteUserParams } from "../types";

async function deleteUser({ id, token }: DeleteUserParams): Promise<void> {
    const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete user");
    }
}

export default function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            // Invalidate and refetch users list
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
}
