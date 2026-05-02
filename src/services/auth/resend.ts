import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not defined in environment variables");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * إرسال رمز التحقق OTP عبر البريد الإلكتروني
 */
export async function sendOtpEmail(email: string, code: string) {
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
            to: email,
            subject: "رمز التحقق الخاص بك",
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">مرحباً بك!</h2>
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
