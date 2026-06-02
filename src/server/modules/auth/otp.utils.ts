import crypto from "crypto";

// ─────────────────────────────────────────────
// OTP Utilities
// ─────────────────────────────────────────────

/**
 * توليد OTP code عشوائي (6 أرقام)
 */
export function generateOtpCode(): string {
    // في development نستخدم 000000 للتسهيل
    if (process.env.NODE_ENV === "development") {
        return "000000";
    }

    return Math.floor(100000 + Math.random() * 900000).toString();
    
}

/**
 * تشفير OTP code باستخدام HMAC
 */
export function hashOtp(code: string): string {
    return crypto
        .createHmac("sha256", process.env.OTP_SECRET!)
        .update(code)
        .digest("hex");
}

/**
 * حساب تاريخ انتهاء صلاحية OTP (5 دقائق)
 */
export function getOtpExpiryDate(): Date {
    return new Date(Date.now() + 5 * 60 * 1000);
}

/**
 * حساب الثواني المتبقية لانتهاء OTP
 */
export function getSecondsUntilExpiry(expiresAt: Date): number {
    return Math.ceil((expiresAt.getTime() - Date.now()) / 1000);
}


export function isOtpValid(expiresAt: Date, used: boolean): boolean {
    return !used && expiresAt > new Date();
}
