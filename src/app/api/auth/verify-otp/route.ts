import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return Response.json({ error: "Phone and code required" }, { status: 400 });
    }

    const otp = await prisma.otpCode.findFirst({
      where: { phone, code, used: false },
      orderBy: { createdAt: "desc" },
    });

    if (!otp || otp.expiresAt < new Date()) {
      return Response.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true },
    });

    // إيجاد أو إنشاء المستخدم تلقائياً
    let user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      user = await prisma.user.create({
        data: { phone, isVerified: true },
      });
    } else if (!user.isVerified) {
      // لو كان موجود بس ما كان verified
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    const token = await new SignJWT({ userId: user.id, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    // ✅ رجّع بيانات محدودة بس
    return Response.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}