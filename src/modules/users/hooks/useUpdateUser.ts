import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateUserParams, User } from "../types";

async function updateUser({
    id,
    data,
    token,
}: UpdateUserParams): Promise<User> {
    const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update user");
    }

    return res.json();
}

export default function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateUser,
        onSuccess: (data) => {
            // Invalidate users list
            queryClient.invalidateQueries({ queryKey: ["users"] });
            // Update specific user cache
            queryClient.invalidateQueries({ queryKey: ["user", data.id] });
        },
    });
}
