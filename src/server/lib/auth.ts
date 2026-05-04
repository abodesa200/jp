/**
 * Authentication Utilities
 */

import { jwtVerify, SignJWT } from "jose";
import { NextRequest } from "next/server";
import { UnauthorizedError } from "../core/errors";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const secret = new TextEncoder().encode(JWT_SECRET);

export interface JwtPayload {
    userId: number;
    role: string;
    email?: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
    return new SignJWT(payload as any)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as JwtPayload;
    } catch {
        throw new UnauthorizedError("Invalid or expired token");
    }
}

export async function extractToken(req: NextRequest): Promise<string> {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
        throw new UnauthorizedError("No token provided");
    }

    return authHeader.substring(7);
}

export async function authenticate(req: NextRequest): Promise<JwtPayload> {
    const token = await extractToken(req);
    return verifyToken(token);
}

export function requireRole(payload: JwtPayload, ...roles: string[]) {
    if (!roles.includes(payload.role)) {
        throw new UnauthorizedError(`Required role: ${roles.join(" or ")}`);
    }
}
