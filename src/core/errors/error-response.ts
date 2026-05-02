import { AppError } from "../errors/app-error";

export function formatErrorResponse(error: unknown) {
    if (error instanceof AppError) {
        return {
            success: false,
            error: {
                message: error.message,
                code: error.code,
                status: error.statusCode,
            },
        };
    }

    console.error(error);

    return {
        success: false,
        error: {
            message: "Internal server error",
            code: "INTERNAL_ERROR",
            status: 500,
        },
    };
}