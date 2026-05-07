/**
 * Authentication Contract
 * كل الـ APIs المتعلقة بالـ Authentication
 */
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { errorSchema, userSchema } from './schemas/common';

const c = initContract();

// ─────────────────────────────────────────────
// Request Schemas
// ─────────────────────────────────────────────

const sendOtpRequestSchema = z.object({
    email: z.string().email({ message: 'Invalid email format' }),
    appContext: z.enum(['client', 'driver'], {
        errorMap: () => ({ message: "appContext must be 'client' or 'driver'" }),
    }),
});

const verifyOtpRequestSchema = z.object({
    email: z.string().email({ message: 'Invalid email format' }),
    code: z.string().length(6, { message: 'OTP code must be 6 digits' }),
    appContext: z.enum(['client', 'driver'], {
        errorMap: () => ({ message: "appContext must be 'client' or 'driver'" }),
    }),
});

const adminLoginRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

// ─────────────────────────────────────────────
// Response Schemas
// ─────────────────────────────────────────────

const sendOtpResponseSchema = z.object({
    success: z.boolean(),
    expiresInSeconds: z.number(),
});

const verifyOtpResponseSchema = z.object({
    success: z.boolean(),
    token: z.string(),
    user: z.object({
        id: z.number(),
        email: z.string().email(),
        role: z.enum(['CLIENT', 'DRIVER', 'ADMIN', 'CUSTOMER_SUPPORT']),
        isVerified: z.boolean(),
    }),
});

const adminLoginResponseSchema = z.object({
    success: z.boolean(),
    token: z.string(),
    user: userSchema,
});

// ─────────────────────────────────────────────
// Contract
// ─────────────────────────────────────────────

export const authContract = c.router({
    // POST /api/auth/send-otp
    sendOtp: {
        method: 'POST',
        path: '/api/auth/send-otp',
        summary: 'Send OTP to email',
        description: `
Send OTP verification code via email using Resend service
- For new users (client): Account is created automatically upon verification
- For drivers: Account must exist and be approved by admin beforehand
- Rate Limiting: 3 attempts every 10 minutes
- OTP validity: 5 minutes
    `.trim(),
        body: sendOtpRequestSchema,
        responses: {
            200: sendOtpResponseSchema,
            400: errorSchema,
            403: z.object({
                error: z.literal('Driver account pending approval'),
            }),
            404: z.object({
                error: z.literal('No driver account found'),
            }),
            429: z.object({
                error: z.string(),
                retryAfterSeconds: z.number(),
            }),
        },
    },

    // POST /api/auth/verify-otp
    verifyOtp: {
        method: 'POST',
        path: '/api/auth/verify-otp',
        summary: 'Verify OTP and get JWT',
        description: `
Verify OTP code and get JWT token
- For new users (client): Account is created automatically
- For drivers: Account must exist
- JWT valid for 7 days
- Token returned in response and Cookie
    `.trim(),
        body: verifyOtpRequestSchema,
        responses: {
            200: verifyOtpResponseSchema,
            400: z.object({
                error: z.literal('Invalid or expired OTP'),
            }),
            403: z.object({
                error: z.literal('This account is not a driver account.'),
            }),
        },
    },

    // POST /api/auth/admin-login
    adminLogin: {
        method: 'POST',
        path: '/api/auth/admin-login',
        summary: 'Admin login with email and password',
        description: 'Admin authentication using email and password',
        body: adminLoginRequestSchema,
        responses: {
            200: adminLoginResponseSchema,
            401: errorSchema,
        },
    },
});
