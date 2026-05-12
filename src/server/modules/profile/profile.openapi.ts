import { registry } from '@/server/lib/openapi/registry'
import { updateClientProfileSchema, updateDriverProfileSchema } from './profile.schema'

// ─────────────────────────────────────────────
// Get Client Profile
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'get',

    path: '/api/profile',

    tags: ['Profile'],

    responses: {
        200: {
            description: 'Client profile retrieved successfully',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            user: {
                                type: 'object',
                            },
                        },
                    },
                },
            },
        },

        401: {
            description: 'Unauthorized',
        },

        404: {
            description: 'User not found',
        },
    },
})

// ─────────────────────────────────────────────
// Update Client Profile
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'patch',

    path: '/api/profile',

    tags: ['Profile'],

    request: {
        body: {
            content: {
                'application/json': {
                    schema: updateClientProfileSchema,
                },
            },
        },
    },

    responses: {
        200: {
            description: 'Profile updated successfully',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            data: {
                                type: 'object',
                            },
                        },
                    },
                },
            },
        },

        400: {
            description: 'Validation error',
        },

        401: {
            description: 'Unauthorized',
        },

        409: {
            description: 'Conflict (email or phone already used)',
        },
    },
})

// ─────────────────────────────────────────────
// Get Driver Profile
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'get',

    path: '/api/profile/driver',

    tags: ['Profile'],

    responses: {
        200: {
            description: 'Driver profile retrieved successfully',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            data: {
                                type: 'object',
                            },
                        },
                    },
                },
            },
        },

        401: {
            description: 'Unauthorized',
        },

        403: {
            description: 'Forbidden – only drivers can access this endpoint',
        },

        404: {
            description: 'Driver profile not found',
        },
    },
})

// ─────────────────────────────────────────────
// Update Driver Profile
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'patch',

    path: '/api/profile/driver',

    tags: ['Profile'],

    request: {
        body: {
            content: {
                'application/json': {
                    schema: updateDriverProfileSchema,
                },
            },
        },
    },

    responses: {
        200: {
            description: 'Driver profile updated successfully',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            data: {
                                type: 'object',
                            },
                        },
                    },
                },
            },
        },

        400: {
            description: 'Validation error',
        },

        401: {
            description: 'Unauthorized',
        },

        403: {
            description: 'Forbidden – only drivers can access this endpoint',
        },

        409: {
            description: 'Conflict (email or phone already used)',
        },
    },
})
