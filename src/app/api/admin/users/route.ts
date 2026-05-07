import { handleApiError } from "@/server/core/http/http-errors";
import { authenticate } from "@/server/lib/auth/auth";
import {
    createUserSchema,
    createUserService,
    getUsersQuerySchema,
    getUsersService,
} from "@/server/modules/admin";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// GET /api/admin/users
// Get users list
// ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const payload = await authenticate(req);

        const { searchParams } = new URL(req.url);
        const query = getUsersQuerySchema.parse({
            role: searchParams.get("role") || undefined,
            page: searchParams.get("page") || "1",
            limit: searchParams.get("limit") || "20",
            search: searchParams.get("search") || undefined,
        });

        const result = await getUsersService(payload, query);

        return NextResponse.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}

// ─────────────────────────────────────────────
// POST /api/admin/users
// Create new user
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const payload = await authenticate(req);

        const body = await req.json();
        const data = createUserSchema.parse(body);

        const result = await createUserService(payload, data);

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}