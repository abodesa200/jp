import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "../types";

interface CreateUserData {
    phone: string;
    name: string;
    email?: string;
    role?: "CLIENT" | "ADMIN" | "CUSTOMER_SUPPORT" | "DRIVER";
}

interface CreateUserParams {
    data: CreateUserData;
    token: string;
}

async function createUser({ data, token }: CreateUserParams): Promise<User> {
    const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create user");
    }

    return res.json();
}

export default function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            // Invalidate users list to refetch
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
}
