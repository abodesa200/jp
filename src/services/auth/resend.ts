import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not defined in environment variables");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Development mode: skip actual email sending and log to console
const DEV_MODE = process.env.SKIP_EMAIL_SENDING === "true";
const VERIFIED_EMAIL = process.env.RESEND_VERIFIED_EMAIL || "abdullatifsalaas@gmail.com";

/**
 * إرسال رمز التحقق OTP عبر البريد الإلكتروني
 */
export async function sendOtpEmail(email: string, code: string) {
    try {
        // Development mode: just log the OTP
        if (DEV_MODE) {
            console.log("\n=================================");
            console.log("📧 DEV MODE: OTP Email (not sent)");
            console.log("=================================");
            console.log(`To: ${email}`);
            console.log(`OTP Code: ${code}`);
            console.log("=================================\n");
            return { success: true, data: { id: "dev-mode" } };
        }

        // In testing mode, only send to verified email
        // For other emails, log a warning but don't fail
        const targetEmail = email === VERIFIED_EMAIL ? email : VERIFIED_EMAIL;

        if (email !== VERIFIED_EMAIL) {
            console.warn(`⚠️  Resend testing mode: Redirecting email from ${email} to ${VERIFIED_EMAIL}`);
            console.log(`📧 OTP Code for ${email}: ${code}`);
        }

        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
            to: targetEmail,
            subject: `رمز التحقق الخاص بك ${email !== VERIFIED_EMAIL ? `(for ${email})` : ""}`,
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">مرحباً بك!</h2>
                    ${email !== VERIFIED_EMAIL ? `<p style="color: #e11d48; font-weight: bold;">⚠️ Testing Mode: This OTP is for ${email}</p>` : ""}
                    <p style="font-size: 16px; color: #555;">
                        رمز التحقق الخاص بك هو:
                    </p>
                    <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <h1 style="color: #2563eb; font-size: 36px; margin: 0; letter-spacing: 8px;">
                            ${code}
                        </h1>
                    </div>
                    <p style="font-size: 14px; color: #777;">
                        هذا الرمز صالح لمدة 5 دقائق فقط.
                    </p>
                    <p style="font-size: 14px; color: #777;">
                        إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend error:", error);
            throw new Error(`Failed to send email: ${error.message}`);
        }

        return { success: true, data };
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw error;
    }
}
