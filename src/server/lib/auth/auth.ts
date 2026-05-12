import { UnauthorizedError } from "@/server/core/http/http-errors";
import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface JWTPayload {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
}

export async function verifyToken(req: NextRequest): Promise<JWTPayload> {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
        throw new UnauthorizedError();
    }

    const token = authHeader.slice(7);
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as JWTPayload;
    } catch {
        throw new UnauthorizedError();

    }
}



