import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendOtpEmail(email: string, code: string) {
  await resend.emails.send({
    from: "onboarding@resend.dev", // مجاني بدون domain خاص
    to: email,
    subject: "كود التحقق",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>كود التحقق الخاص بك</h2>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">
          ${code}
        </p>
        <p>صالح لمدة 5 دقائق فقط</p>
      </div>
    `,
  });
}