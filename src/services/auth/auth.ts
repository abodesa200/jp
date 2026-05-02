import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface JWTPayload {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
}

export async function verifyToken(req: NextRequest): Promise<JWTPayload | null> {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.slice(7);
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as JWTPayload;
    } catch {
        return null;
    }
}

export function unauthorized() {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
    return Response.json({ error: "Forbidden" }, { status: 403 });
}
