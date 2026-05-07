import { ZodError } from "zod";
import { AppError } from "../errors/app-error";

export function handleApiError(error: unknown) {
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