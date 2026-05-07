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





// ─────────────────────────────────────────────
// JWT Payload Type
// ─────────────────────────────────────────────

// export type JWTPayload = {
//     userId: number;
//     role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
//     isVerified?: boolean;
// };

// ─────────────────────────────────────────────
// Verify JWT from Request
// ─────────────────────────────────────────────

// export async function verifyJWT(req: NextRequest): Promise<JWTPayload> {
//     const authHeader = req.headers.get("authorization");

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//         throw new UnauthorizedError("Missing or invalid authorization header");
//     }

//     const token = authHeader.substring(7); // Remove "Bearer " prefix

//     try {
//         const payload = await jwtService.verify(token);

//         return {
//             userId: payload.userId as number,
//             role: payload.role as JWTPayload["role"],
//             isVerified: payload.isVerified,
//         };
//     } catch (error) {
//         throw new UnauthorizedError("Invalid or expired token");
//     }
// }
