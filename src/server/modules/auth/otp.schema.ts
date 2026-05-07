import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from "zod";

// تفعيل OpenAPI extensions على Zod
extendZodWithOpenApi(z);

// ─────────────────────────────────────────────
// Send OTP Schema
// ─────────────────────────────────────────────

export const sendOtpSchema = z.object({
    email: z.string().email("Invalid email format").openapi({
        description: "User's email address",
        example: "user@example.com",
    }),
    appContext: z.enum(["client", "driver"], {
        message: "appContext must be 'client' or 'driver'",
    }).openapi({
        description: "User type: client (regular user) or driver (must exist and be approved)",
        example: "client",
    }),
});

// ─────────────────────────────────────────────
// Verify OTP Schema
// ─────────────────────────────────────────────

export const verifyOtpSchema = z.object({
    email: z.string().email("Invalid email format").openapi({
        description: "Email address",
        example: "user@example.com",
    }),
    code: z.string().length(6, "OTP code must be 6 digits").openapi({
        description: "6-digit verification code",
        example: "123456",
    }),
    appContext: z.enum(["client", "driver"], {
        message: "appContext must be 'client' or 'driver'",
    }).openapi({
        description: "User type",
        example: "client",
    }),
}).openapi('VerifyOtpRequest');

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type SendOtpDTO = z.infer<typeof sendOtpSchema>;
export type VerifyOtpDTO = z.infer<typeof verifyOtpSchema>;
