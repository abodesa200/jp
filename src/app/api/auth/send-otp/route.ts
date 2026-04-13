import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { phone } = await req.json();

        if (!phone || !/^\+?[0-9]{10,15}$/.test(phone)) {
            return Response.json({ error: "Invalid phone number" }, { status: 400 });
        }

        const lastOtp = await prisma.otpCode.findFirst({
            where: {
                phone,
                createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
            },
            orderBy: { createdAt: "desc" },
        });

        const recentOtps = await prisma.otpCode.count({
            where: {
                phone,
                createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
            },
        });

        if (recentOtps >= 3) {
            const retryAfterMs = lastOtp
                ? 10 * 60 * 1000 - (Date.now() - new Date(lastOtp.createdAt).getTime())
                : 0;
            return Response.json(
                {
                    error: "Too many attempts, try again later",
                    retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
                },
                { status: 429 }
            );
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await prisma.otpCode.create({
            data: {
                phone,
                code: "000000",
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
        });

        console.log(`OTP for ${phone}: ${code}`);

        return Response.json({ success: true, phone, expiresInSeconds: 300 });
    } catch (error) {
        return Response.json({ error: error }, { status: 500 });
    }
}