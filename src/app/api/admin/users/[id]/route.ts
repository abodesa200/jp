import { handleApiError } from "@/server/core/http/http-errors";
import { authenticate } from "@/server/lib/auth/auth";
import {
    deleteUserService,
    getUserByIdService,
    updateUserSchema,
    updateUserService,
} from "@/server/modules/admin";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/users/:id
// Get user by ID
// ─────────────────────────────────────────────

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await authenticate(req);
        const { id } = await params;
        const userId = parseInt(id, 10);

        if (isNaN(userId)) {
            return NextResponse.json(
                { error: "Invalid user ID" },
                { status: 400 }
            );
        }

        const result = await getUserByIdService(payload, userId);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// PATCH /api/admin/users/:id
// Update user
// ─────────────────────────────────────────────

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await authenticate(req);
        const { id } = await params;
        const userId = parseInt(id, 10);

        if (isNaN(userId)) {
            return NextResponse.json(
                { error: "Invalid user ID" },
                { status: 400 }
            );
        }

        const body = await req.json();
        const data = updateUserSchema.parse(body);

        const result = await updateUserService(payload, userId, data);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// DELETE /api/admin/users/:id
// Delete user
// ─────────────────────────────────────────────

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const payload = await authenticate(req);
        const { id } = await params;
        const userId = parseInt(id, 10);

        if (isNaN(userId)) {
            return NextResponse.json(
                { error: "Invalid user ID" },
                { status: 400 }
            );
        }

        const result = await deleteUserService(payload, userId);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}
