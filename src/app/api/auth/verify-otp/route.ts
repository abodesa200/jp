import { prisma } from "@/lib/prisma";
import { hashOtp } from "@/services/auth/otp";
import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: Request) {
    try {
        const { email, code, appContext } = await req.json();

        if (!email || !code) {
            return Response.json({ error: "Email and code required" }, { status: 400 });
        }

        if (!appContext || !["client", "driver"].includes(appContext)) {
            return Response.json({ error: "Valid appContext required (client or driver)" }, { status: 400 });
        }

        // جيب آخر OTP صالح
        const otp = await prisma.otpCode.findFirst({
            where: { email, used: false, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" },
        });

        if (!otp || otp.code !== hashOtp(code)) {
            return Response.json({ error: "Invalid or expired OTP" }, { status: 400 });
        }

        // منع race condition
        const updated = await prisma.otpCode.updateMany({
            where: { id: otp.id, used: false },
            data: { used: true },
        });

        if (updated.count === 0) {
            return Response.json({ error: "OTP already used" }, { status: 400 });
        }

        let user = await prisma.user.findUnique({
            where: { email },
            include: { driver: true },
        });

        if (user) {
            // مستخدم موجود — تحقق من التطابق
            if (appContext === "driver" && user.role !== "DRIVER") {
                return Response.json(
                    { error: "This account is not a driver account." },
                    { status: 403 }
                );
            }
            if (appContext === "client" && user.role !== "CLIENT") {
                return Response.json(
                    { error: "This account is not a client account." },
                    { status: 403 }
                );
            }
        } else {
            // مستخدم جديد — client فقط، driver ينشئه الأدمن
            if (appContext === "driver") {
                return Response.json(
                    { error: "Driver registration requires admin approval." },
                    { status: 400 }
                );
            }

            user = await prisma.user.create({
                data: {
                    email,
                    role: "CLIENT",
                    // isVerified: false — رح يتحقق بخطوة الرقم لاحقاً
                },
                include: { driver: true },
            });
        }

        // JWT — role مباشرة من DB
        const token = await new SignJWT({
            userId: user.id,
            role: user.role,   // ← CLIENT | DRIVER | ADMIN | CUSTOMER_SUPPORT
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(secret);

        return new Response(
            JSON.stringify({
                success: true,
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    isVerified: user.isVerified,
                },
            }),
            {
                headers: {
                    "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`,
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (e) {
        console.error(e);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}