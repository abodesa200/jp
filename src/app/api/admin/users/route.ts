import { prisma } from "@/lib/prisma";
import { forbidden, unauthorized, verifyToken } from "@/services/auth/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();
    if (payload.role !== "ADMIN") return forbidden();

    const { searchParams } = new URL(req.url);

    const roleParam = searchParams.get("role");
    const validRoles = ["CLIENT", "DRIVER", "ADMIN", "CUSTOMER_SUPPORT"] as const;

    if (!roleParam || !validRoles.includes(roleParam as any)) {
        return Response.json(
            { error: "Invalid role. Must be one of: CLIENT, DRIVER, ADMIN, CUSTOMER_SUPPORT" },
            { status: 400 }
        );
    }

    const role = roleParam as typeof validRoles[number];
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where: { role },
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                driver: role === "DRIVER",  // ← منطقي الحين
            },
        }),
        prisma.user.count({ where: { role } }),
    ]);

    return Response.json({
        users,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        },
    });
}

export async function POST(req: NextRequest) {
    try {
        const payload = await verifyToken(req);
        if (!payload) return unauthorized();
        if (payload.role !== "ADMIN") return forbidden();

        const body = await req.json();
        const { phone, email, name, driver } = body;

        if (!phone && !email) {
            return Response.json({ error: "phone or email required" }, { status: 400 });
        }

        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    phone ? { phone } : undefined,
                    email ? { email } : undefined,
                ].filter(Boolean) as any,
            },
        });

        if (existing) {
            return Response.json({ error: "User already exists" }, { status: 409 });
        }

        // إذا في driver data — الأدمن عم ينشئ سائق
        if (driver) {
            const requiredFields = ["licenseNumber", "carModel", "carPlate"];
            const missing = requiredFields.filter((field) => !driver[field]);

            if (missing.length > 0) {
                return Response.json({ error: "Missing driver fields", missing }, { status: 400 });
            }
        }

        const user = await prisma.user.create({
            data: {
                phone,
                email,
                name,
                role: driver ? "DRIVER" : "CLIENT",  // ← role يتحدد هون
                driver: driver
                    ? {
                        create: {
                            licenseNumber: driver.licenseNumber,
                            carModel: driver.carModel,
                            carPlate: driver.carPlate,
                            carColor: driver.carColor,
                            carYear: driver.carYear,
                        },
                    }
                    : undefined,
            },
            include: { driver: true },
        });

        return Response.json({ success: true, user });

    } catch (e) {
        console.error(e);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}