import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { success } from "@/server/core/http/response";
import { getDriverWalletService } from "@/server/modules/drivers/wallet";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);
        const wallet = await getDriverWalletService(payload);
        return success(wallet);
    } catch (error) {
        return handleApiError(error);
    }
}
