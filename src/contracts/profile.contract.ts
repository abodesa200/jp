/**
 * Profile Contract
 * كل الـ APIs المتعلقة بالـ User Profile
 */
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { driverSchema, errorSchema, userSchema } from './schemas/common';

const c = initContract();

// ─────────────────────────────────────────────
// Request Schemas
// ─────────────────────────────────────────────

const updateProfileRequestSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    avatarUrl: z.string().url().optional(),
    driverInfo: z
        .object({
            licenseNumber: z.string().optional(),
            carModel: z.string().optional(),
            carPlate: z.string().optional(),
            carColor: z.string().optional(),
            carYear: z.number().optional(),
            isOnline: z.boolean().optional(),
        })
        .optional(),
});

// ─────────────────────────────────────────────
// Response Schemas
// ─────────────────────────────────────────────

const profileResponseSchema = userSchema.extend({
    driver: driverSchema.nullable(),
});

const updateProfileResponseSchema = z.object({
    user: userSchema,
    driver: driverSchema.nullable(),
});

// ─────────────────────────────────────────────
// Contract
// ─────────────────────────────────────────────

export const profileContract = c.router({
    // GET /api/profile - Get current user profile
    getProfile: {
        method: 'GET',
        path: '/api/profile',
        summary: 'Get current user profile',
        description: `
Fetches current user profile
- For drivers: includes driver information (car details, rating, etc.)
- For clients: returns basic user information
    `.trim(),
        responses: {
            200: profileResponseSchema,
            401: errorSchema,
        },
    },

    // PATCH /api/profile - Update user profile
    updateProfile: {
        method: 'PATCH',
        path: '/api/profile',
        summary: 'Update user profile',
        description: `
Update user profile information
- Can update basic user info (name, email, avatarUrl)
- For drivers: can also update driver info (car details, online status)
    `.trim(),
        body: updateProfileRequestSchema,
        responses: {
            200: updateProfileResponseSchema,
            401: errorSchema,
            409: z.object({
                error: z.literal('Email already in use'),
            }),
        },
    },
});
