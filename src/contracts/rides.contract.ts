/**
 * Rides Contract
 * كل الـ APIs المتعلقة بالـ Rides
 */
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { errorSchema, paginationQuerySchema, rideSchema, rideTypeSchema } from './schemas/common';

const c = initContract();

// ─────────────────────────────────────────────
// Request Schemas
// ─────────────────────────────────────────────

const createRideRequestSchema = z.object({
    pickupLat: z.number().min(-90).max(90),
    pickupLng: z.number().min(-180).max(180),
    pickupAddress: z.string().optional(),
    dropoffLat: z.number().min(-90).max(90),
    dropoffLng: z.number().min(-180).max(180),
    dropoffAddress: z.string().optional(),
    type: rideTypeSchema.default('STANDARD'),
    maxPassengers: z.number().min(1).max(4).default(1),
});

const updateRideStatusRequestSchema = z.object({
    status: z.enum(['DRIVER_ARRIVED', 'IN_PROGRESS', 'COMPLETED']),
});

const cancelRideRequestSchema = z.object({
    reason: z.string().optional(),
});

const nearbyRidesQuerySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    radius: z.coerce.number().min(1).max(50).default(10),
});

// ─────────────────────────────────────────────
// Response Schemas
// ─────────────────────────────────────────────

const ridesListResponseSchema = z.object({
    rides: z.array(rideSchema),
    total: z.number(),
});

// ─────────────────────────────────────────────
// Contract
// ─────────────────────────────────────────────

export const ridesContract = c.router({
    // GET /api/rides - Get my rides (passenger)
    getMyRides: {
        method: 'GET',
        path: '/api/rides',
        summary: '🧑 Get passenger rides',
        description: 'Fetches rides for current user as passenger',
        query: paginationQuerySchema.extend({
            status: z.enum(['REQUESTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
        }),
        responses: {
            200: ridesListResponseSchema,
            401: errorSchema,
        },
    },

    // POST /api/rides - Create new ride
    createRide: {
        method: 'POST',
        path: '/api/rides',
        summary: '🧑 Create new ride (request ride)',
        description: 'Passenger creates a new ride request',
        body: createRideRequestSchema,
        responses: {
            201: rideSchema,
            400: errorSchema,
            401: errorSchema,
        },
    },

    // GET /api/rides/nearby - Get nearby rides (driver)
    getNearbyRides: {
        method: 'GET',
        path: '/api/rides/nearby',
        summary: '🚗 Nearby available rides (for driver)',
        description: 'Driver views nearby rides available for acceptance',
        query: nearbyRidesQuerySchema,
        responses: {
            200: z.array(rideSchema),
            400: errorSchema,
            401: errorSchema,
            403: errorSchema,
        },
    },

    // GET /api/rides/:id - Get ride details
    getRideById: {
        method: 'GET',
        path: '/api/rides/:id',
        summary: 'Get ride details',
        description: 'Get detailed information about a specific ride',
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        responses: {
            200: rideSchema,
            401: errorSchema,
            403: errorSchema,
            404: errorSchema,
        },
    },

    // POST /api/rides/:id/accept - Accept ride (driver)
    acceptRide: {
        method: 'POST',
        path: '/api/rides/:id/accept',
        summary: '🚗 Accept ride (driver only)',
        description: 'Driver accepts ride request',
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        body: z.object({}),
        responses: {
            200: rideSchema,
            400: errorSchema,
            401: errorSchema,
            403: errorSchema,
            404: errorSchema,
        },
    },

    // PATCH /api/rides/:id - Update ride status
    updateRideStatus: {
        method: 'PATCH',
        path: '/api/rides/:id',
        summary: 'Update ride status',
        description: 'Update ride status (driver only)',
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        body: updateRideStatusRequestSchema,
        responses: {
            200: rideSchema,
            400: errorSchema,
            401: errorSchema,
            403: errorSchema,
            404: errorSchema,
        },
    },

    // POST /api/rides/:id/cancel - Cancel ride
    cancelRide: {
        method: 'POST',
        path: '/api/rides/:id/cancel',
        summary: 'Cancel ride',
        description: 'Cancel ride (passenger or driver)',
        pathParams: z.object({
            id: z.coerce.number(),
        }),
        body: cancelRideRequestSchema,
        responses: {
            200: rideSchema,
            400: errorSchema,
            401: errorSchema,
            403: errorSchema,
            404: errorSchema,
        },
    },
});
