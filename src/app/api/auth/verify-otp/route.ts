import { handleApiError } from "@/server/core/http/error-handler";
import { verifyOtpSchema } from "@/server/modules/auth/otp.schema";
import { verifyOtpService } from "@/server/modules/auth/otp.service";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = verifyOtpSchema.parse(body);

        const result = await verifyOtpService(data);

        return new Response(JSON.stringify(result), {
            headers: {
                "Set-Cookie": `token=${result.token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`,
                "Content-Type": "application/json",
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
}