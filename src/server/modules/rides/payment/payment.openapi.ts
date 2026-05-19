import { registry } from '@/server/lib/openapi/registry'
import { getPaymentsQuerySchema, getPaymentsResponseSchema } from './payment.schema'

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
                    schema: getPaymentsResponseSchema,
                },
            },
        },
        401: { description: 'Unauthorized' },
    },
})
