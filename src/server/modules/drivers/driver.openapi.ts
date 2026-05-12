import { registry } from '@/server/lib/openapi/registry'
import { z } from 'zod'
import {
    getNearbyDriversSchema,
    updateDriverLocationSchema,
    updateDriverStatusSchema,
} from './driver.schema'

const driverIdParams = z.object({ id: z.string() })

// ═════════════════════════════════════════════
// PUBLIC ENDPOINTS
// ═════════════════════════════════════════════

// ─────────────────────────────────────────────
// [PUBLIC] GET /api/drivers/nearby - Get nearby online drivers
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'get',
    path: '/api/drivers/nearby',
    tags: ['Drivers – Public'],
    summary: 'Get online drivers near a given location',
    request: {
        query: getNearbyDriversSchema,
    },
    responses: {
        200: {
            description: 'Nearby drivers retrieved successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        data: z.array(z.object({})),
                    }),
                },
            },
        },
        400: { description: 'Invalid latitude or longitude' },
    },
})

// ─────────────────────────────────────────────
// [PUBLIC] GET /api/drivers/{id} - Get driver public profile
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'get',
    path: '/api/drivers/{id}',
    tags: ['Drivers – Public'],
    summary: 'Get public profile of a driver by ID',
    request: {
        params: driverIdParams,
    },
    responses: {
        200: { description: 'Driver profile retrieved successfully' },
        400: { description: 'Invalid driver ID' },
        404: { description: 'Driver not found' },
    },
})

// ─────────────────────────────────────────────
// [PUBLIC] GET /api/drivers/{id}/reviews - Get driver reviews
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'get',
    path: '/api/drivers/{id}/reviews',
    tags: ['Drivers – Public'],
    summary: 'Get paginated reviews for a driver',
    request: {
        params: driverIdParams,
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(10),
        }),
    },
    responses: {
        200: { description: 'Driver reviews retrieved successfully' },
        400: { description: 'Invalid driver ID' },
        404: { description: 'Driver not found' },
    },
})

// ─────────────────────────────────────────────
// [PUBLIC] GET /api/drivers/{id}/stats - Get driver statistics
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'get',
    path: '/api/drivers/{id}/stats',
    tags: ['Drivers – Public'],
    summary: 'Get statistics for a driver (total rides, rating, etc.)',
    request: {
        params: driverIdParams,
    },
    responses: {
        200: { description: 'Driver stats retrieved successfully' },
        400: { description: 'Invalid driver ID' },
        404: { description: 'Driver not found' },
    },
})

// ═════════════════════════════════════════════
// DRIVER (AUTHENTICATED) ENDPOINTS
// ═════════════════════════════════════════════

// ─────────────────────────────────────────────
// [DRIVER] PUT /api/drivers/location - Update my location
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'put',
    path: '/api/drivers/location',
    tags: ['Drivers – Driver'],
    summary: 'Update the authenticated driver\'s current location',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: updateDriverLocationSchema,
                },
            },
        },
    },
    responses: {
        200: { description: 'Location updated successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden – only drivers can update location' },
    },
})

// ─────────────────────────────────────────────
// [DRIVER] PUT /api/drivers/status - Toggle online/offline
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'put',
    path: '/api/drivers/status',
    tags: ['Drivers – Driver'],
    summary: 'Toggle the authenticated driver\'s online/offline status',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: updateDriverStatusSchema,
                },
            },
        },
    },
    responses: {
        200: { description: 'Status updated successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden – only drivers can update status' },
    },
})
