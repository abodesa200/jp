// lib/otp.ts
import crypto from "crypto";

export function hashOtp(code: string) {
  return crypto
    .createHmac("sha256", process.env.OTP_SECRET!)
    .update(code)
    .digest("hex");
}