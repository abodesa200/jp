import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
    TooManyRequestsError,
} from "@/core/http/http-errors";

import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";
import { hashOtp } from "./otp";
import { SendOtpDTO, VerifyOtpDTO } from "./otp.schema";
import { sendOtpEmail } from "./resend";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// ─────────────────────────────────────────────
// Send OTP Service
// ─────────────────────────────────────────────

export async function sendOtpService(data: SendOtpDTO) {
    const { email, appContext } = data;

    // تحقق driver
    if (appContext === "driver") {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { driver: true },
        });

        if (!user || user.role !== "DRIVER" || !user.driver) {
            throw new NotFoundError("No driver account found");
        }

        if (!user.driver.isApproved) {
            throw new ForbiddenError("Driver account pending approval");
        }
    }

    // 🔥 منع وجود OTP شغال
    const activeOtp = await prisma.otpCode.findFirst({
        where: {
            email,
            used: false,
            expiresAt: { gt: new Date() },
        },
    });

    if (activeOtp) {
        const secondsLeft = Math.ceil(
            (activeOtp.expiresAt.getTime() - Date.now()) / 1000
        );

        throw new TooManyRequestsError(
            `OTP already sent. Try again after ${secondsLeft}s`
        );
    }

    // توليد OTP
    const code = "000000";
    // const code = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.otpCode.create({
        data: {
            email,
            code: hashOtp(code),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
    });

    await sendOtpEmail(email, code);

    return {
        success: true,
        expiresInSeconds: 300,
    };
}

// ─────────────────────────────────────────────
// Verify OTP Service
// ─────────────────────────────────────────────

export async function verifyOtpService(data: VerifyOtpDTO) {
    const { email, code, appContext } = data;

    const otp = await prisma.otpCode.findFirst({
        where: {
            email,
            used: false,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
    });

    if (!otp || otp.code !== hashOtp(code)) {
        throw new BadRequestError("Invalid or expired OTP");
    }

    // atomic update (منع الاستخدام المزدوج)
    const updated = await prisma.otpCode.updateMany({
        where: {
            id: otp.id,
            used: false,
        },
        data: { used: true },
    });

    if (updated.count === 0) {
        throw new BadRequestError("OTP already used");
    }

    let user = await prisma.user.findUnique({
        where: { email },
        include: { driver: true },
    });

    if (user) {
        if (appContext === "driver" && user.role !== "DRIVER") {
            throw new ForbiddenError("This account is not a driver account.");
        }

        if (appContext === "client" && user.role !== "CLIENT") {
            throw new ForbiddenError("This account is not a client account.");
        }
    } else {
        if (appContext === "driver") {
            throw new BadRequestError(
                "Driver registration requires admin approval."
            );
        }

        user = await prisma.user.create({
            data: {
                email,
                role: "CLIENT",
            },
            include: { driver: true },
        });
    }

    const token = await new SignJWT({
        userId: user.id,
        role: user.role,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);

    return {
        success: true,
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
        },
    };
}