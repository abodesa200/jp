import { verifyToken } from "@/services/auth/auth";
import { updateDriverLocation } from "@/services/driver/driver.service";
import { NextRequest, NextResponse } from "next/server";

/**
 * PUT /api/drivers/location
 * تحديث موقع السائق
 */
export async function PUT(req: NextRequest) {
    try {
        // التحقق من التوكن
        const payload = await verifyToken(req);

        if (!payload) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // التحقق من أن المستخدم سائق
        if (payload.role !== "DRIVER") {
            return NextResponse.json(
                { error: "Driver access only" },
                { status: 403 }
            );
        }

        // قراءة البيانات
        const body = await req.json();
        const { latitude, longitude } = body;

        // التحقق من البيانات
        if (
            typeof latitude !== "number" ||
            typeof longitude !== "number" ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return NextResponse.json(
                { error: "Invalid latitude or longitude" },
                { status: 400 }
            );
        }

        // تحديث الموقع
        const updatedDriver = await updateDriverLocation(
            payload.userId,
            latitude,
            longitude
        );

        return NextResponse.json({
            success: true,
            data: updatedDriver,
        });
    } catch (error) {
        console.error("Error updating driver location:", error);

        // إذا كان الخطأ من Prisma (السائق غير موجود)
        if (error instanceof Error && error.message.includes("Record to update not found")) {
            return NextResponse.json(
                { error: "Driver profile not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: "Failed to update location" },
            { status: 500 }
        );
    }
}
