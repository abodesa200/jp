import { z } from "zod";

// ─────────────────────────────────────────────
// Send OTP Schema
// ─────────────────────────────────────────────

export const sendOtpSchema = z.object({
    email: z.string().email("Invalid email format"),
    appContext: z.enum(["client", "driver"], {
        message: "appContext must be 'client' or 'driver'",
    }),
});

// ─────────────────────────────────────────────
// Verify OTP Schema
// ─────────────────────────────────────────────

export const verifyOtpSchema = z.object({
    email: z.string().email("Invalid email format"),
    code: z.string().length(6, "OTP code must be 6 digits"),
    appContext: z.enum(["client", "driver"], {
        message: "appContext must be 'client' or 'driver'",
    }),
});

// ─────────────────────────────────────────────
// Type inference
// ─────────────────────────────────────────────

export type SendOtpDTO = z.infer<typeof sendOtpSchema>;
export type VerifyOtpDTO = z.infer<typeof verifyOtpSchema>;
