import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─────────────────────────────────────────────
// Email Service
// ─────────────────────────────────────────────

/**
 * إرسال OTP عبر البريد الإلكتروني
 */
export async function sendOtpEmail(email: string, code: string) {
    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
            to: email,
            subject: "Your OTP Code",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your OTP Code</h2>
          <p>Use this code to complete your login:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
            ${code}
          </div>
          <p style="color: #666; margin-top: 20px;">This code will expire in 5 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
        });
    } catch (error) {
        console.error("Failed to send OTP email:", error);
        throw new Error("Failed to send OTP email");
    }
}

/**
 * إرسال email ترحيبي
 */
export async function sendWelcomeEmail(email: string, name: string) {
    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
            to: email,
            subject: "Welcome!",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome ${name}!</h2>
          <p>Thank you for joining us. We're excited to have you on board.</p>
        </div>
      `,
        });
    } catch (error) {
        console.error("Failed to send welcome email:", error);
        // لا نرمي error هنا لأن الـ welcome email ليس critical
    }
}

/**
 * إرسال email إشعار بموافقة driver
 */
export async function sendDriverApprovalEmail(email: string, name: string) {
    try {
        await resend.emails.send({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
            to: email,
            subject: "Driver Account Approved",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Congratulations ${name}!</h2>
          <p>Your driver account has been approved. You can now start accepting rides.</p>
        </div>
      `,
        });
    } catch (error) {
        console.error("Failed to send driver approval email:", error);
    }
}
