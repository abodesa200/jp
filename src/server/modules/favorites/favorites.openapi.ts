import { registry } from '@/server/lib/openapi/registry'
import { z } from 'zod'
import { addFavoriteSchema } from './favorites.schema'

const favoriteIdParams = z.object({ id: z.string() })

// ─────────────────────────────────────────────
// GET /api/favorites - Get favorite locations
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'get',
    path: '/api/favorites',
    tags: ['Favorites'],
    summary: 'Get all favorite locations for the current user',
    responses: {
        200: {
            description: 'Favorites retrieved successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        data: z.array(z.object({})),
                    }),
                },
            },
        },
        401: { description: 'Unauthorized' },
    },
})

// ─────────────────────────────────────────────
// POST /api/favorites - Add a favorite location
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'post',
    path: '/api/favorites',
    tags: ['Favorites'],
    summary: 'Add a new favorite location',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: addFavoriteSchema,
                },
            },
        },
    },
    responses: {
        201: { description: 'Favorite added successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
    },
})

// ─────────────────────────────────────────────
// DELETE /api/favorites/{id} - Delete a favorite location
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'delete',
    path: '/api/favorites/{id}',
    tags: ['Favorites'],
    summary: 'Delete a favorite location by ID',
    request: {
        params: favoriteIdParams,
    },
    responses: {
        200: { description: 'Favorite deleted successfully' },
        400: { description: 'Invalid favorite ID' },
        401: { description: 'Unauthorized' },
        404: { description: 'Favorite not found' },
    },
})
