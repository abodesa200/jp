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

