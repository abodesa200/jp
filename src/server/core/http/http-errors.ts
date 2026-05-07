import { AppError } from "../errors/app-error";

export class ValidationError extends AppError {
    constructor(message: string, public field?: string) {
        super(message, 400, "VALIDATION_ERROR");
    }
}

export class UnauthorizedError extends AppError {
    constructor(message?: string) {
        super(message || "Unauthorized", 401, "UNAUTHORIZED");
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, "CONFLICT");
    }
}

export class BadRequestError extends AppError {
    constructor(message: string) {
        super(message, 400, "BAD_REQUEST");
    }
}

export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404, "NOT_FOUND");
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string) {
        super(message, 403, "FORBIDDEN");
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message: string) {
        super(message, 429, "TOO_MANY_REQUESTS");
    }
}