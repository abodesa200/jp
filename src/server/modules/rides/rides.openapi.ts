import { registry } from '@/server/lib/openapi/registry'
import { applyPromoSchema } from '@/services/promo/promo.schema'
import { z } from 'zod'
import { availableCarpoolingQuerySchema, joinCarpoolingSchema } from './carpooling/carpooling.schema'
import { rideHistoryQuerySchema } from './history/history.schema'
import { negotiateRideSchema, respondToNegotiationSchema } from './negotiation/negotiation.schema'
import { createPaymentSchema, updatePaymentSchema } from './payment/payment.schema'
import { createReviewSchema, getReviewsQuerySchema } from './reviews/reviews.schema'
import { createRideSchema, getNearbyRidesQuerySchema, getRidesQuerySchema } from './rides.schema'
import { cancelRideSchema, updateRideStatusSchema } from './status/status.schema'

const rideIdParams = z.object({ id: z.string() })

// ═════════════════════════════════════════════
// CLIENT ENDPOINTS
// ═════════════════════════════════════════════

// ─────────────────────────────────────────────
// [CLIENT] POST /api/rides - Create a new ride
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'post',
    path: '/api/rides',
    tags: ['Rides – Client'],
    summary: 'Create a new ride',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: createRideSchema,
                },
            },
        },
    },
    responses: {
        201: { description: 'Ride created successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
    },
})

// ─────────────────────────────────────────────
// [CLIENT] GET /api/rides - Get my rides
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// [CLIENT] GET /api/rides/history - Ride history with filters
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// [CLIENT] GET /api/rides/export - Export ride history as CSV
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'get',
    path: '/api/rides/export',
    tags: ['Rides – Client'],
    summary: 'Export ride history as a CSV file',
    request: {
        query: rideHistoryQuerySchema,
    },
    responses: {
        200: { description: 'CSV file downloaded' },
        401: { description: 'Unauthorized' },
    },
})

// ─────────────────────────────────────────────
// [CLIENT] GET /api/rides/carpooling/available - Browse available carpooling rides
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// [CLIENT] GET /api/rides/reviews - Get my submitted reviews
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// [CLIENT] GET /api/rides/{id} - Get ride details
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// [CLIENT] POST /api/rides/{id}/cancel - Cancel a ride
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// [CLIENT] POST /api/rides/{id}/join - Join a carpooling ride
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// [CLIENT] DELETE /api/rides/{id}/leave - Leave a carpooling ride
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// [CLIENT] POST /api/rides/{id}/negotiate - Start or counter a price negotiation
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'post',
    path: '/api/rides/{id}/negotiate',
    tags: ['Rides – Client'],
    summary: 'Start a price negotiation or send a counter offer',
    request: {
        params: rideIdParams,
        body: {
            content: {
                'application/json': {
                    schema: negotiateRideSchema,
                },
            },
        },
    },
    responses: {
        200: { description: 'Negotiation started or counter offer sent' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        404: { description: 'Ride not found' },
    },
})

// ─────────────────────────────────────────────
// [CLIENT] PATCH /api/rides/{id}/negotiate - Accept or reject a negotiation
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'patch',
    path: '/api/rides/{id}/negotiate',
    tags: ['Rides – Client'],
    summary: 'Accept or reject a price negotiation offer',
    request: {
        params: rideIdParams,
        body: {
            content: {
                'application/json': {
                    schema: respondToNegotiationSchema,
                },
            },
        },
    },
    responses: {
        200: { description: 'Negotiation accepted or rejected' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        404: { description: 'Negotiation not found' },
    },
})

// ─────────────────────────────────────────────
// [CLIENT] POST /api/rides/{id}/apply-promo - Apply a promo code
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'post',
    path: '/api/rides/{id}/apply-promo',
    tags: ['Rides – Client'],
    summary: 'Apply a promo code to a ride',
    request: {
        params: rideIdParams,
        body: {
            content: {
                'application/json': {
                    schema: applyPromoSchema,
                },
            },
        },
    },
    responses: {
        200: { description: 'Promo code applied successfully' },
        400: { description: 'Invalid or expired promo code' },
        401: { description: 'Unauthorized' },
        404: { description: 'Ride not found' },
    },
})

// ─────────────────────────────────────────────
// [CLIENT] POST /api/rides/{id}/payment - Create payment for a ride
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'post',
    path: '/api/rides/{id}/payment',
    tags: ['Rides – Client'],
    summary: 'Create a payment record for a completed ride',
    request: {
        params: rideIdParams,
        body: {
            content: {
                'application/json': {
                    schema: createPaymentSchema,
                },
            },
        },
    },
    responses: {
        201: { description: 'Payment created successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        404: { description: 'Ride not found' },
    },
})

// ─────────────────────────────────────────────
// [CLIENT] GET /api/rides/{id}/payment - Get ride payment details
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'get',
    path: '/api/rides/{id}/payment',
    tags: ['Rides – Client'],
    summary: 'Get payment details for a specific ride',
    request: {
        params: rideIdParams,
    },
    responses: {
        200: { description: 'Payment details retrieved successfully' },
        401: { description: 'Unauthorized' },
        404: { description: 'Payment not found' },
    },
})

// ─────────────────────────────────────────────
// [CLIENT] POST /api/rides/{id}/review - Submit a review
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// [CLIENT] GET /api/rides/{id}/review - Get review for a ride
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// [DRIVER] GET /api/rides/nearby - Get nearby ride requests
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// [DRIVER] POST /api/rides/{id}/accept - Accept a ride request
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// [DRIVER] PATCH /api/rides/{id} - Update ride status
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// [DRIVER] GET /api/rides/{id}/passengers - Get carpooling passengers
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// [DRIVER] PATCH /api/rides/{id}/payment - Update payment status
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'patch',
    path: '/api/rides/{id}/payment',
    tags: ['Rides – Driver'],
    summary: 'Update payment status after receiving payment',
    request: {
        params: rideIdParams,
        body: {
            content: {
                'application/json': {
                    schema: updatePaymentSchema,
                },
            },
        },
    },
    responses: {
        200: { description: 'Payment status updated successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Forbidden – only the assigned driver can update payment' },
        404: { description: 'Payment not found' },
    },
})
