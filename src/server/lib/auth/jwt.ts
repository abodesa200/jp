import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// export const jwtService = {
//     async sign(user: { id: number; role: string }) {
//         return new SignJWT({
//             userId: user.id,
//             role: user.role,
//         })
//             .setProtectedHeader({ alg: "HS256" })
//             .setIssuedAt()
//             .setExpirationTime("7d")
//             .sign(secret);
//     },

//     async verify(token: string) {
//         const { payload } = await jwtVerify(token, secret);
//         return payload;
//     },
// };

export const jwtService = {
    async sign(user: { id: number; role: string; isVerified?: boolean }) {
        return new SignJWT({
            userId: user.id,
            role: user.role,
            isVerified: user.isVerified ?? false,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(secret);
    },

    async verify(token: string) {
        try {
            const { payload } = await jwtVerify(token, secret);
            return payload as {
                userId: number;
                role: string;
                isVerified?: boolean;
            };
        } catch {
            throw new Error("Invalid or expired token");
        }
    },
};