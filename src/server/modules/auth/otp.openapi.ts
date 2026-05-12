import { registry } from '@/server/lib/openapi/registry'

import {
  sendOtpSchema,
  verifyOtpSchema,
} from './otp.schema'

// ─────────────────────────────────────────────
// Send OTP
// ─────────────────────────────────────────────

registry.registerPath({
  method: 'post',

  path: '/api/auth/send-otp',

  tags: ['Auth'],

  request: {
    body: {
      content: {
        'application/json': {
          schema: sendOtpSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: 'OTP sent successfully',
    },

    400: {
      description: 'Invalid request',
    },
  },
})

// ─────────────────────────────────────────────
// Verify OTP
// ─────────────────────────────────────────────

registry.registerPath({
  method: 'post',

  path: '/api/auth/verify-otp',

  tags: ['Auth'],

  request: {
    body: {
      content: {
        'application/json': {
          schema: verifyOtpSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: 'OTP verified successfully',
    },

    400: {
      description: 'Invalid OTP',
    },

    401: {
      description: 'Unauthorized',
    },
  },
})