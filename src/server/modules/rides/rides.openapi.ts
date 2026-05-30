import { registry } from '@/server/lib/openapi/registry'
import { z } from 'zod'
import { availableCarpoolingQuerySchema, joinCarpoolingSchema } from './carpooling/carpooling.schema'
import { rideHistoryQuerySchema } from './history/history.schema'
import { createReviewSchema, getReviewsQuerySchema } from './reviews/reviews.schema'
import { calculateRidePriceSchema, createRideOpenApiSchema, getNearbyRidesQuerySchema, getRidesQuerySchema } from './rides.schema'
import { cancelRideSchema, updateRideStatusSchema } from './status/status.schema'

const rideIdParams = z.object({ id: z.string() })

// ═════════════════════════════════════════════
// CLIENT ENDPOINTS
// ═════════════════════════════════════════════

registry.registerPath({
    method: 'post',
    path: '/api/rides',
    tags: ['Rides – Client'],
    summary: 'Create a new ride',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: createRideOpenApiSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: 'Ride created successfully',
            content: {
                'application/json': {
                    schema: createRideOpenApiSchema,
                },
            },
        },
    },
})

registry.registerPath({
    method: 'get',
    path: '/api/rides',
    tags: ['Rides – Client'],
    summary: 'Get current user rides (client or driver)',
    request: {
        query: getRidesQuerySchema,
    },
    responses: {
        200: {
            description: 'Rides retrieved successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        data: z.object({}),
                    }),
                },
            },
        },
        401: { description: 'Unauthorized' },
    },
})

registry.registerPath({
    method: 'get',
    path: '/api/rides/check-coupon',
    tags: ['Rides – Client'],
    summary: 'Validate a coupon code and preview the discount',
    description: [
        'Two ways to call this endpoint:',
        '- **Option A** – already have the fare: `?code=SAVE20&systemFare=12.50`',
        '- **Option B** – send coordinates and let the server calculate the fare: `?code=SAVE20&pickupLat=...&pickupLng=...&dropoffLat=...&dropoffLng=...`',
    ].join('\n'),
    request: {
        query: z.object({
            code: z.string().openapi({ description: 'Coupon code', example: 'SAVE20' }),
            systemFare: z.coerce.number().optional().openapi({ description: 'Fare from calculate-price (Option A)', example: 12.50 }),
            pickupLat: z.coerce.number().optional().openapi({ description: 'Required if systemFare not provided (Option B)', example: 33.51 }),
            pickupLng: z.coerce.number().optional().openapi({ example: 36.29 }),
            dropoffLat: z.coerce.number().optional().openapi({ example: 33.52 }),
            dropoffLng: z.coerce.number().optional().openapi({ example: 36.30 }),
            serviceType: z.enum(['STANDARD', 'VIP', 'VAN']).optional().openapi({ example: 'STANDARD' }),
            rideMode: z.enum(['PRIVATE', 'CARPOOLING']).optional().openapi({ example: 'PRIVATE' }),
        }),
    },
    responses: {
        200: {
            description: 'Coupon is valid – returns discount details',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        data: z.object({
                            valid: z.boolean(),
                            coupon: z.object({
                                code: z.string(),
                                discountType: z.enum(['PERCENTAGE', 'FIXED']),
                                discountValue: z.number(),
                                maxDiscount: z.number().nullable(),
                            }),
                            pricing: z.object({
                                systemFare: z.number(),
                                discountAmount: z.number(),
                                finalFare: z.number(),
                            }),
                        }),
                    }),
                },
            },
        },
        400: { description: 'Invalid, expired, or already used coupon' },
        401: { description: 'Unauthorized' },
        403: { description: 'Only clients can check coupons' },
    },
})

registry.registerPath({
    method: 'post',
    path: '/api/rides/calculate-price',
    tags: ['Rides – Client'],
    summary: 'Calculate estimated ride price',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: calculateRidePriceSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Ride price calculated successfully',
            content: {
                'application/json': {
                    schema: calculateRidePriceSchema,
                },
            },
        },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Only clients can calculate price' },
    },
})

registry.registerPath({
    method: 'get',
    path: '/api/rides/history',
    tags: ['Rides – Client'],
    summary: 'Get ride history with optional filters',
    request: {
        query: rideHistoryQuerySchema,
    },
    responses: {
        200: { description: 'Ride history retrieved successfully' },
        401: { description: 'Unauthorized' },
    },
})


registry.registerPath({
    method: 'get',
    path: '/api/rides/carpooling/available',
    tags: ['Rides – Client'],
    summary: 'Get available carpooling rides near a location',
    request: {
        query: availableCarpoolingQuerySchema,
    },
    responses: {
        200: { description: 'Available carpooling rides retrieved' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
    },
})

registry.registerPath({
    method: 'get',
    path: '/api/rides/reviews',
    tags: ['Rides – Client'],
    summary: 'Get all reviews submitted by the current user',
    request: {
        query: getReviewsQuerySchema,
    },
    responses: {
        200: { description: 'Reviews retrieved successfully' },
        401: { description: 'Unauthorized' },
    },
})

registry.registerPath({
    method: 'get',
    path: '/api/rides/{id}',
    tags: ['Rides – Client'],
    summary: 'Get details of a specific ride',
    request: {
        params: rideIdParams,
    },
    responses: {
        200: { description: 'Ride details retrieved successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden – not your ride' },
        404: { description: 'Ride not found' },
    },
})

registry.registerPath({
    method: 'post',
    path: '/api/rides/{id}/cancel',
    tags: ['Rides – Client'],
    summary: 'Cancel a ride (client or driver)',
    request: {
        params: rideIdParams,
        body: {
            content: {
                'application/json': {
                    schema: cancelRideSchema,
                },
            },
        },
    },
    responses: {
        200: { description: 'Ride cancelled successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        404: { description: 'Ride not found' },
    },
})

registry.registerPath({
    method: 'post',
    path: '/api/rides/{id}/join',
    tags: ['Rides – Client'],
    summary: 'Join an existing carpooling ride',
    request: {
        params: rideIdParams,
        body: {
            content: {
                'application/json': {
                    schema: joinCarpoolingSchema,
                },
            },
        },
    },
    responses: {
        201: { description: 'Joined carpooling ride successfully' },
        400: { description: 'Validation error or ride is full' },
        401: { description: 'Unauthorized' },
        404: { description: 'Ride not found' },
    },
})

registry.registerPath({
    method: 'delete',
    path: '/api/rides/{id}/leave',
    tags: ['Rides – Client'],
    summary: 'Leave a carpooling ride you joined',
    request: {
        params: rideIdParams,
    },
    responses: {
        200: { description: 'Left carpooling ride successfully' },
        401: { description: 'Unauthorized' },
        404: { description: 'Ride or passenger not found' },
    },
})




registry.registerPath({
    method: 'post',
    path: '/api/rides/{id}/review',
    tags: ['Rides – Client'],
    summary: 'Submit a review for a completed ride',
    request: {
        params: rideIdParams,
        body: {
            content: {
                'application/json': {
                    schema: createReviewSchema,
                },
            },
        },
    },
    responses: {
        201: { description: 'Review submitted successfully' },
        400: { description: 'Validation error or ride not completed' },
        401: { description: 'Unauthorized' },
        404: { description: 'Ride not found' },
        409: { description: 'Review already submitted for this ride' },
    },
})

registry.registerPath({
    method: 'get',
    path: '/api/rides/{id}/tip-suggestion',
    tags: ['Rides – Client'],
    summary: 'Get ML-suggested tip amount for a completed ride',
    description: 'Returns a suggested tip amount from the ML model based on ride data. Only available after the ride is COMPLETED.',
    request: {
        params: rideIdParams,
    },
    responses: {
        200: {
            description: 'Tip suggestion returned successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        data: z.object({
                            suggestedTip: z.number().openapi({ example: 2.50 }),
                            finalFare: z.number().nullable().openapi({ example: 12.50 }),
                        }),
                    }),
                },
            },
        },
        400: { description: 'Ride is not completed yet' },
        401: { description: 'Unauthorized' },
        403: { description: 'Only the ride client can request a tip suggestion' },
        404: { description: 'Ride not found' },
    },
})

registry.registerPath({
    method: 'get',
    path: '/api/rides/{id}/review',
    tags: ['Rides – Client'],
    summary: 'Get the review submitted for a specific ride',
    request: {
        params: rideIdParams,
    },
    responses: {
        200: { description: 'Review retrieved successfully' },
        401: { description: 'Unauthorized' },
        404: { description: 'Review not found' },
    },
})

// ═════════════════════════════════════════════
// DRIVER ENDPOINTS
// ═════════════════════════════════════════════

registry.registerPath({
    method: 'get',
    path: '/api/rides/nearby',
    tags: ['Rides – Driver'],
    summary: "Get ride requests near the driver's current location",
    request: {
        query: getNearbyRidesQuerySchema,
    },
    responses: {
        200: { description: 'Nearby rides retrieved successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden – only drivers can access this endpoint' },
    },
})

registry.registerPath({
    method: 'post',
    path: '/api/rides/{id}/accept',
    tags: ['Rides – Driver'],
    summary: 'Accept a pending ride request',
    request: {
        params: rideIdParams,
    },
    responses: {
        200: { description: 'Ride accepted successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden – only drivers can accept rides' },
        404: { description: 'Ride not found' },
        409: { description: 'Ride already accepted by another driver' },
    },
})

registry.registerPath({
    method: 'patch',
    path: '/api/rides/{id}',
    tags: ['Rides – Driver'],
    summary: 'Update the status of a ride (e.g. IN_PROGRESS, COMPLETED)',
    request: {
        params: rideIdParams,
        body: {
            content: {
                'application/json': {
                    schema: updateRideStatusSchema,
                },
            },
        },
    },
    responses: {
        200: { description: 'Ride status updated successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden – only the assigned driver can update status' },
        404: { description: 'Ride not found' },
    },
})

registry.registerPath({
    method: 'get',
    path: '/api/rides/{id}/passengers',
    tags: ['Rides – Driver'],
    summary: 'Get the list of passengers in a carpooling ride',
    request: {
        params: rideIdParams,
    },
    responses: {
        200: { description: 'Passengers list retrieved successfully' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden – only the assigned driver can view passengers' },
        404: { description: 'Ride not found' },
    },
})



// بعد DRIVER endpoints ضيف هاد:

registry.registerPath({
    method: 'post',
    path: '/api/rides/{id}/complete',
    tags: ['Rides – Driver'],
    summary: 'Complete a ride and get tip suggestions from ML model',
    description: 'Driver marks the ride as completed. Returns the final fare and 3 tip options suggested by the ML model.',
    request: {
        params: rideIdParams,
    },
    responses: {
        200: {
            description: 'Ride completed – tip suggestions returned',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        data: z.object({
                            ride: z.object({}).passthrough(),
                            suggestedTips: z.array(z.number()).openapi({ example: [1.25, 2.50, 5.00] }),
                        }),
                    }),
                },
            },
        },
        400: { description: 'Ride is not IN_PROGRESS' },
        401: { description: 'Unauthorized' },
        403: { description: 'Only the assigned driver can complete the ride' },
        404: { description: 'Ride not found' },
    },
})

registry.registerPath({
    method: 'post',
    path: '/api/rides/{id}/tip',
    tags: ['Rides – Client'],
    summary: 'Add a tip to a completed ride',
    description: 'Client selects a tip amount. The tip is added to the driver wallet immediately.',
    request: {
        params: rideIdParams,
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        amount: z.number().positive().openapi({ example: 2.50 }),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Tip added successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        success: z.boolean(),
                        data: z.object({
                            ride: z.object({}).passthrough(),
                            tip: z.number().openapi({ example: 2.50 }),
                            totalAmount: z.number().openapi({ example: 15.00 }),
                        }),
                    }),
                },
            },
        },
        400: { description: 'Ride is not completed' },
        401: { description: 'Unauthorized' },
        403: { description: 'Only the ride client can add a tip' },
        404: { description: 'Ride not found' },
        409: { description: 'Tip already added' },
    },
})