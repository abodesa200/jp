/**
 * Standardized API Response Helpers
 */

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export function successResponse<T>(data: T, meta?: ApiResponse["meta"]): ApiResponse<T> {
    return {
        success: true,
        data,
        ...(meta && { meta }),
    };
}

export function errorResponse(message: string, code?: string): ApiResponse {
    return {
        success: false,
        error: {
            message,
            code,
        },
    };
}

export function paginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
): ApiResponse<T[]> {
    return {
        success: true,
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
