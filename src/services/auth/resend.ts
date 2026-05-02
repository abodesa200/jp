import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY || "");
type SendOtpResult =
    | { success: true; data: any }
    | { success: false; error: string };

export async function sendOtpEmail(
    email: string,
    code: string
): Promise<SendOtpResult> {
    try {
        if (!email || !code) {
            return { success: false, error: "Missing email or code" };
        }

        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error("Missing RESEND_API_KEY");
            return { success: false, error: "Server misconfigured" };
        }

        // 3. إرسال الإيميل
        const { data, error } = await resend.emails.send({
            from: "Your App <onboarding@resend.dev>",
            to: email,
            subject: "رمز التحقق الخاص بك",
            html: `
        <div dir="rtl" style="font-family: Arial; max-width:600px; margin:auto;">
          <h2>رمز التحقق</h2>

          <p>استخدم الرمز التالي:</p>

          <div style="background:#f4f4f4;padding:20px;text-align:center;border-radius:8px;">
            <h1 style="letter-spacing:6px;color:#2563eb;">
              ${String(code)}
            </h1>
          </div>

          <p style="font-size:12px;color:#777;margin-top:20px;">
            صالح لمدة 5 دقائق فقط
          </p>
        </div>
      `,
        });

        // 4. معالجة خطأ Resend بشكل آمن
        if (error) {
            console.error("Resend error:", error);
            return {
                success: false,
                error: error.message || "Email sending failed",
            };
        }
        console.log("SEND RESULT:", { data, error });
        return { success: true, data };
    } catch (err) {
        console.error("Unexpected error:", err);

        return {
            success: false,
            error: "Internal server error",
        };
    }
}