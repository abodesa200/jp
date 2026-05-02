import { NextResponse } from "next/server";

// ─────────────────────────────────────────────
// Success Response
// ─────────────────────────────────────────────

export function success<T>(data: T, status: number = 200) {
    return NextResponse.json(
        {
            success: true,
            data,
        },
        { status }
    );
}

// ─────────────────────────────────────────────
// Error Response (manual usage if needed)
// ─────────────────────────────────────────────

export function error(
    message: string,
    status: number = 500,
    code: string = "ERROR",
    field?: string
) {
    return NextResponse.json(
        {
            success: false,
            error: {
                message,
                code,
                ...(field ? { field } : {}),
            },
        },
        { status }
    );
}