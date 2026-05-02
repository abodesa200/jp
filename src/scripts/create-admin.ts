/**
 * سكريبت لإنشاء أول أدمن
 * الاستخدام: npx tsx src/scripts/create-admin.ts
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
        process.exit(1);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        console.log("Admin already exists:", email);
        process.exit(0);
    }

    const passwordHash = await hash(password, 12);

    const admin = await prisma.user.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: {
            email,
            passwordHash,
            role: "ADMIN" as any,
            isVerified: true,
            name: "Admin",
        } as any,
    });

    console.log("✅ Admin created:", admin.email);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
