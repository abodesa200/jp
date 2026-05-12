import { registry } from '@/server/lib/openapi/registry'
import { getPaymentsQuerySchema } from './payment.schema'

// ─────────────────────────────────────────────
// GET /api/payments - Get my payments
// ─────────────────────────────────────────────

registry.registerPath({
    method: 'get',
    path: '/api/payments',
    tags: ['Payments'],
    summary: 'Get all payments for the current user (client sees payments made, driver sees payments received)',
    request: {
        query: getPaymentsQuerySchema,
    },
    responses: {
        200: {
            description: 'Payments retrieved successfully',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            data: {
                                type: 'object',
                                properties: {
                                    payments: { type: 'array', items: { type: 'object' } },
                                    pagination: {
                                        type: 'object',
                                        properties: {
                                            total: { type: 'integer' },
                                            page: { type: 'integer' },
                                            limit: { type: 'integer' },
                                            pages: { type: 'integer' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        401: { description: 'Unauthorized' },
    },
})
