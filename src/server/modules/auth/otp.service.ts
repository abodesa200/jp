import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
    TooManyRequestsError,
} from "@/server/core/http/http-errors";
import { jwtService } from "@/server/lib/auth/jwt";
import { sendOtpEmail } from "./email.service";
import { otpRepository } from "./otp.repository";
import { SendOtpDTO, VerifyOtpDTO } from "./otp.schema";
import { generateOtpCode, getOtpExpiryDate, hashOtp } from "./otp.utils";
import { userRepository } from "./user.repository";
import { profileRepository } from "../profile/profile.repository";
import { ConflictError } from "@/server/core/http/http-errors";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// ─────────────────────────────────────────────
// Send OTP Service
// ─────────────────────────────────────────────

export async function sendOtpService(data: SendOtpDTO) {
    const { email, appContext } = data;
    const purpose =
        appContext === "driver"
            ? "DRIVER_LOGIN"
            : "CLIENT_LOGIN";
    // تحقق driver
    if (appContext === "driver") {
        const user = await userRepository.findByEmailWithDriver(email);

        if (!user || user.role !== "DRIVER" || !user.driver) {
            throw new NotFoundError("No driver account found");
        }

        if (!user.driver.isApproved) {
            throw new ForbiddenError("Driver account pending approval");
        }
    }

    const activeOtp = await otpRepository.findActiveOtp(email, purpose);

    if (activeOtp) {
        const secondsLeft = Math.ceil(
            (activeOtp.expiresAt.getTime() - Date.now()) / 1000
        );

        throw new TooManyRequestsError(
            `OTP already sent. Try again after ${secondsLeft}s`
        );
    }

    // توليد OTP
    const code = generateOtpCode();
    const hashedCode = hashOtp(code);
    const expiresAt = getOtpExpiryDate();

    await otpRepository.createOtp(email, hashedCode, expiresAt, purpose);
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
    const { email, code, appContext, name, phone } = data;

    const purpose =
        appContext === "driver"
            ? "DRIVER_LOGIN"
            : "CLIENT_LOGIN";

    const otp = await otpRepository.findLatestOtp(email, purpose);

    if (!otp || otp.code !== hashOtp(code)) {
        throw new BadRequestError("Invalid or expired OTP");
    }

    // atomic update (منع الاستخدام المزدوج)
    const updated = await otpRepository.markAsUsed(otp.id);

    if (updated.count === 0) {
        throw new BadRequestError("OTP already used");
    }

    let user = await userRepository.findByEmailWithDriver(email);

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

        if (phone) {
            const existingPhone = await profileRepository.findByPhone(phone);
            if (existingPhone) {
                throw new ConflictError("Phone already in use");
            }
        }

        user = await userRepository.createClient(email, { name, phone });
    }

    const token = await jwtService.sign({
        id: user.id,
        role: user.role,
        isVerified: user.isVerified,
    });

    return {
        success: true,
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            isVerified: user.isVerified,
        },
    };
}
