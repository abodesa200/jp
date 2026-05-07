import { handleApiError } from "@/server/core/http/error-handler";
import { sendOtpSchema } from "@/server/modules/auth/otp.schema";
import { sendOtpService } from "@/server/modules/auth/otp.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = sendOtpSchema.parse(body);

        const result = await sendOtpService(data);

        return Response.json(result);
    } catch (error) {
        return handleApiError(error);
    }
}