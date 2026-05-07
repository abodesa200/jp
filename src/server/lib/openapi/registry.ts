import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

/**
 * OpenAPI Registry - مركز تسجيل كل الـ routes والـ schemas
 * 
 * استخدام:
 * 1. سجل الـ schema: registry.register('User', userSchema)
 * 2. سجل الـ route: registry.registerPath({ ... })
 */
export const registry = new OpenAPIRegistry();

// Security Schemes
registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT token from /api/auth/verify-otp',
});
