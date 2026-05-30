import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import { success } from "@/server/core/http/response";
import {
    getWalletTransactionsService,
    walletTransactionsQuerySchema,
} from "@/server/modules/drivers/wallet";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const payload = await verifyToken(req);

        const url = new URL(req.url);
        const query = walletTransactionsQuerySchema.parse({
            page: url.searchParams.get("page") || 1,
            limit: url.searchParams.get("limit") || 20,
        });

        const result = await getWalletTransactionsService(payload, query);
        return success(result);
    } catch (error) {
        return handleApiError(error);
    }
}
