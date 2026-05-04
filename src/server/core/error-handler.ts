/**
 * Global Error Handler for API Routes
 */

import { ZodError } from "zod";
import { AppError } from "./errors";
import { errorResponse } from "./response";

export function handleApiError(error: unknown): Response {
    console.error("API Error:", error);

    // Zod validation errors
    if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        return Response.json(errorResponse(messages.join(", "), "VALIDATION_ERROR"), {
            status: 422,
        });
    }

    // Application errors
    if (error instanceof AppError) {
        return Response.json(errorResponse(error.message), {
            status: error.statusCode,
        });
    }

    // Unknown errors
    return Response.json(errorResponse("Internal server error"), {
        status: 500,
    });
}
