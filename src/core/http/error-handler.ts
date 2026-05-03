import { ZodError } from "zod";
import { AppError } from "../errors/app-error";

// ─────────────────────────────────────────────
// Error Handler for API Routes
// ─────────────────────────────────────────────

export function handleApiError(error: unknown) {
    // Zod Validation Error
    if (error instanceof ZodError) {
        return Response.json(
            {
                success: false,
                error: {
                    message: error.issues[0].message,
                    code: "VALIDATION_ERROR",
                    status: 400,
                    field: error.issues[0].path.join("."),
                },
            },
            { status: 400 }
        );
    }

    // Custom App Error
    if (error instanceof AppError) {
        return Response.json(
            {
                success: false,
                error: {
                    message: error.message,
                    code: error.code,
                    status: error.statusCode,
                },
            },
            { status: error.statusCode }
        );
    }

    // Unknown Error
    console.error("Unhandled error:", error);
    return Response.json(
        {
            success: false,
            error: {
                message: "Internal server error",
                code: "INTERNAL_ERROR",
                status: 500,
            },
        },
        { status: 500 }
    );
}
