/**
 * Drivers Contract
 * كل الـ APIs المتعلقة بالـ Drivers
 */
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { driverSchema, errorSchema } from './schemas/common';

const c = initContract();

// ─────────────────────────────────────────────
// Request Schemas
// ─────────────────────────────────────────────

const updateLocationRequestSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});

const updateDriverStatusRequestSchema = z.object({
    isOnline: z.boolean(),
});

// ─────────────────────────────────────────────
// Response Schemas
// ─────────────────────────────────────────────

const updateLocationResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        id: z.number(),
        latitude: z.number(),
        longitude: z.number(),
        lastLocationUpdate: z.string().datetime(),
    }),
});

// ─────────────────────────────────────────────
// Contract
// ─────────────────────────────────────────────

export const driversContract = c.router({
    // PUT /api/drivers/location - Update driver location
    updateLocation: {
        method: 'PUT',
        path: '/api/drivers/location',
        summary: '🚗 Update driver location',
        description: `
Driver updates their current location
- Used when opening the app or pressing "Update Location" button
- Saves last update timestamp (lastLocationUpdate)
- Required for drivers only (role=DRIVER)
    `.trim(),
        body: updateLocationRequestSchema,
        responses: {
            200: updateLocationResponseSchema,
            400: errorSchema,
            401: errorSchema,
            403: z.object({
                error: z.literal('Unauthorized - Driver access only'),
            }),
        },
    },

    // PUT /api/drivers/status - Update driver online status
    updateStatus: {
        method: 'PUT',
        path: '/api/drivers/status',
        summary: '🚗 Update driver online status',
        description: 'Driver updates their online/offline status',
        body: updateDriverStatusRequestSchema,
        responses: {
            200: driverSchema,
            401: errorSchema,
            403: errorSchema,
        },
    },

    // GET /api/drivers/:id - Get driver details
    getDriverById: {
        method: 'GET',
        path: '/api/drivers/:id',
        summary: 'Get driver details',
        description: 'Get detailed information about a specific driver',
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        responses: {
            200: driverSchema,
            404: errorSchema,
        },
    },
});
