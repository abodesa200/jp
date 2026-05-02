import { prisma } from "@/lib/prisma";
import { hashOtp } from "@/services/auth/otp";
import { sendOtpEmail } from "@/services/auth/resend";

export async function POST(req: Request) {
    try {
        const { email, appContext } = await req.json();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return Response.json({ error: "Invalid email" }, { status: 400 });
        }

        if (!appContext || !["client", "driver"].includes(appContext)) {
            return Response.json({ error: "Invalid appContext" }, { status: 400 });
        }

        // driver لازم يكون موجود ومعتمد مسبقاً من الأدمن
        if (appContext === "driver") {
            const user = await prisma.user.findUnique({
                where: { email },
                include: { driver: true },
            });

            if (!user || user.role !== "DRIVER" || !user.driver) {
                return Response.json({ error: "No driver account found" }, { status: 404 });
            }

            if (!user.driver.isApproved) {
                return Response.json({ error: "Driver account pending approval" }, { status: 403 });
            }
        }

        // منع إرسال OTP إذا في واحد شغال
        const activeOtp = await prisma.otpCode.findFirst({
            where: { email, used: false, expiresAt: { gt: new Date() } },
        });

        // if (activeOtp) {
        //     const secondsLeft = Math.ceil((activeOtp.expiresAt.getTime() - Date.now()) / 1000);
        //     return Response.json(
        //         { error: "OTP already sent", retryAfterSeconds: secondsLeft },
        //         { status: 429 }
        //     );
        // }

        // rate limit
        const recent = await prisma.otpCode.count({
            where: { email, createdAt: { gte: new Date(Date.now() - 60 * 1000) } },
        });

        if (recent >= 3) {
            return Response.json({ error: "Too many requests" }, { status: 429 });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await prisma.otpCode.create({
            data: {
                email,
                code: hashOtp(code),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
        });

        await sendOtpEmail(email, code);

        return Response.json({ success: true, expiresInSeconds: 300 });

    } catch (e) {
        console.error(e);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}