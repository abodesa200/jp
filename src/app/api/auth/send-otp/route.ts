
import { AppError } from "@/core/errors/app-error";
import { sendOtpSchema } from "@/services/auth/otp.schema";
import { sendOtpService } from "@/services/auth/otp.service";
import { ZodError } from "zod";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = sendOtpSchema.parse(body);

        const result = await sendOtpService(data);

        return Response.json(result);
    } catch (error) {
        if (error instanceof ZodError) {
            return Response.json(
                {
                    success: false,
                    error: {
                        message: error.issues[0].message,
                        code: "VALIDATION_ERROR",
                        status: 400,
                    },
                },
                { status: 400 }
            );
        }

        if (error instanceof AppError) {
            return Response.json(
                {
                    success: false,
                    error: {
                        message: error.message,
                        code: error.code,
                        status: error.statusCode,
                    },
                },
                { status: error.statusCode }
            );
        }

        console.error(error);
        return Response.json(
            {
                success: false,
                error: {
                    message: error,
                    code: "INTERNAL_ERROR",
                    status: 500,
                },
            },
            { status: 500 }
        );
    }
}