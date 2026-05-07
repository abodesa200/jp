import { registry } from '@/server/lib/openapi/registry';
import { z } from 'zod';
import { sendOtpSchema, verifyOtpSchema } from './otp.schema';

// ─────────────────────────────────────────────
// Response Schemas
// ─────────────────────────────────────────────

const sendOtpResponseSchema = z.object({
    success: z.boolean().openapi({ example: true }),
    expiresInSeconds: z.number().openapi({
        example: 300,
        description: 'OTP validity duration in seconds',
    }),
}).openapi('SendOtpResponse');

const verifyOtpResponseSchema = z.object({
    success: z.boolean().openapi({ example: true }),
    token: z.string().openapi({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'JWT token valid for 7 days',
    }),
    user: z.object({
        id: z.number().openapi({ example: 1 }),
        email: z.string().email().openapi({ example: 'user@example.com' }),
        role: z.enum(['CLIENT', 'DRIVER', 'ADMIN', 'CUSTOMER_SUPPORT']).openapi({ example: 'CLIENT' }),
        isVerified: z.boolean().openapi({ example: true }),
    }),
}).openapi('VerifyOtpResponse');

const errorResponseSchema = z.object({
    error: z.string(),
}).openapi('ErrorResponse');

// ─────────────────────────────────────────────
// Register Routes
// ─────────────────────────────────────────────

// POST /api/auth/send-otp
registry.registerPath({
    method: 'post',
    path: '/api/auth/send-otp',
    tags: ['Authentication'],
    summary: 'Send OTP to email',
    description: `
Send OTP verification code via email using Resend service
- For new users (client): Account is created automatically upon verification
- For drivers: Account must exist and be approved by admin beforehand
- Rate Limiting: 3 attempts every 10 minutes
- OTP validity: 5 minutes
  `.trim(),
    request: {
        body: {
            content: {
                'application/json': {
                    schema: sendOtpSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'OTP sent successfully',
            content: {
                'application/json': {
                    schema: sendOtpResponseSchema,
                },
            },
        },
        400: {
            description: 'Invalid email or context',
            content: {
                'application/json': {
                    schema: errorResponseSchema,
                },
            },
        },
        403: {
            description: 'Driver account pending approval',
            content: {
                'application/json': {
                    schema: errorResponseSchema.extend({
                        error: z.literal('Driver account pending approval'),
                    }),
                },
            },
        },
        404: {
            description: 'No driver account found',
            content: {
                'application/json': {
                    schema: errorResponseSchema.extend({
                        error: z.literal('No driver account found'),
                    }),
                },
            },
        },
        429: {
            description: 'Too many requests (rate limited)',
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string().openapi({ example: 'Too many requests' }),
                        retryAfterSeconds: z.number().openapi({
                            example: 600,
                            description: 'Seconds before retry is allowed',
                        }),
                    }),
                },
            },
        },
    },
});

// POST /api/auth/verify-otp
registry.registerPath({
    method: 'post',
    path: '/api/auth/verify-otp',
    tags: ['Authentication'],
    summary: 'Verify OTP and get JWT',
    description: `
Verify OTP code and get JWT token
- For new users (client): Account is created automatically
- For drivers: Account must exist
- JWT valid for 7 days
- Token returned in response and Cookie
  `.trim(),
    request: {
        body: {
            content: {
                'application/json': {
                    schema: verifyOtpSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Verification successful',
            headers: {
                'Set-Cookie': {
                    description: 'JWT token in HttpOnly cookie',
                    schema: {
                        type: 'string',
                        example: 'token=eyJhbGc...; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict',
                    },
                },
            },
            content: {
                'application/json': {
                    schema: verifyOtpResponseSchema,
                },
            },
        },
        400: {
            description: 'Invalid or expired OTP',
            content: {
                'application/json': {
                    schema: errorResponseSchema.extend({
                        error: z.literal('Invalid or expired OTP'),
                    }),
                },
            },
        },
        403: {
            description: 'Account type mismatch',
            content: {
                'application/json': {
                    schema: errorResponseSchema.extend({
                        error: z.literal('This account is not a driver account.'),
                    }),
                },
            },
        },
    },
});
