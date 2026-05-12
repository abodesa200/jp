import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// POST /api/auth/admin-login
export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return Response.json({ error: "Email and password are required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                passwordHash: true,
                isVerified: true,
            },
        });

        if (!user || user.role !== "ADMIN" || !user.passwordHash) {
            return Response.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const valid = await compare(password, user.passwordHash);
        if (!valid) {
            return Response.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const token = await new SignJWT({ userId: user.id, role: user.role })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("8h")
            .sign(secret);

        return Response.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(error);
        return Response.json({ error: error }, { status: 500 });
    }
}
