import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

// ─────────────────────────────────────────────

export const sendOtpSchema = z
  .object({
    email: z.string().email().openapi({
      description: "User's email address",
      example: 'user@example.com',
    }),

    appContext: z
      .enum(['client', 'driver'])
      .openapi({
        description:
          'User type: client or driver',
        example: 'client',
      }),
  })

  // 👇 مهم جدًا
  .openapi('SendOtpBody')

// ─────────────────────────────────────────────

export const verifyOtpSchema = z
  .object({
    email: z.string().email().openapi({
      description: 'Email address',
      example: 'user@example.com',
    }),

    code: z.string().length(6).openapi({
      description: '6-digit verification code',
      example: '123456',
    }),

    appContext: z
      .enum(['client', 'driver'])
      .openapi({
        description: 'User type',
        example: 'client',
      }),

    name: z.string().min(2).max(50).optional().openapi({
      description: 'Full name (required for new client signup)',
      example: 'أحمد محمد',
    }),

    phone: z.string().min(6).max(20).optional().openapi({
      description: 'Phone number (required for new client signup)',
      example: '0501234567',
    }),
  })

  // 👇 مهم جدًا
  .openapi('VerifyOtpBody')

// ─────────────────────────────────────────────

export type SendOtpDTO =
  z.infer<typeof sendOtpSchema>

export type VerifyOtpDTO =
  z.infer<typeof verifyOtpSchema>