import { ForbiddenError, NotFoundError } from "@/server/core/http/http-errors";
import { driverRepository } from "../driver.repository";
import { walletRepository } from "./wallet.repository";
import { WalletTransactionsQueryDTO } from "./wallet.schema";

type JWTPayload = {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
};

export async function getDriverWalletService(payload: JWTPayload) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can access this endpoint");
    }

    const driver = await driverRepository.findDriverByUserId(payload.userId);
    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    const wallet = await walletRepository.findOrCreateWallet(driver.id);

    return wallet;
}

export async function getWalletTransactionsService(
    payload: JWTPayload,
    query: WalletTransactionsQueryDTO
) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can access this endpoint");
    }

    const driver = await driverRepository.findDriverByUserId(payload.userId);
    if (!driver) {
        throw new NotFoundError("Driver profile not found");
    }

    const wallet = await walletRepository.findWalletByDriverId(driver.id);
    if (!wallet) {
        return { transactions: [], pagination: { page: query.page, limit: query.limit, total: 0, totalPages: 0 } };
    }

    return walletRepository.getTransactions(wallet.id, query.page, query.limit);
}
