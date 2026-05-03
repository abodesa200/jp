/**
 * سكريبت لإنشاء مستخدمين للاختبار (عميل وسائق)
 * 
 * الاستخدام:
 * tsx src/scripts/create-test-users.ts
 */

import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Creating test users...\n");

    // 1. إنشاء عميل للاختبار
    const clientPhone = "+963911111111";
    let client = await prisma.user.findUnique({
        where: { phone: clientPhone },
    });

    if (!client) {
        client = await prisma.user.create({
            data: {
                phone: clientPhone,
                name: "محمد العميل",
                email: "client@test.com",
                role: "CLIENT",
                isVerified: true,
            },
        });
        console.log("✅ Client created:");
    } else {
        console.log("ℹ️  Client already exists:");
    }
    console.log(`   ID: ${client.id}`);
    console.log(`   Phone: ${client.phone}`);
    console.log(`   Name: ${client.name}\n`);

    // 2. إنشاء سائق للاختبار
    const driverPhone = "+963922222222";
    let driverUser = await prisma.user.findUnique({
        where: { phone: driverPhone },
    });

    if (!driverUser) {
        driverUser = await prisma.user.create({
            data: {
                phone: driverPhone,
                name: "أحمد السائق",
                email: "driver@test.com",
                role: "DRIVER",
                isVerified: true,
            },
        });
        console.log("✅ Driver user created:");
    } else {
        console.log("ℹ️  Driver user already exists:");
    }
    console.log(`   ID: ${driverUser.id}`);
    console.log(`   Phone: ${driverUser.phone}`);
    console.log(`   Name: ${driverUser.name}\n`);

    // 3. إنشاء ملف السائق
    let driver = await prisma.driver.findUnique({
        where: { userId: driverUser.id },
    });

    if (!driver) {
        driver = await prisma.driver.create({
            data: {
                userId: driverUser.id,
                licenseNumber: "DL123456",
                carModel: "Toyota Corolla 2020",
                carPlate: "ABC 123",
                carColor: "White",
                carYear: 2020,
                isApproved: true,
                isOnline: false,
                latitude: 33.5138,
                longitude: 36.2765,
                rating: 4.8,
                totalRides: 0,
            },
        });
        console.log("✅ Driver profile created:");
    } else {
        // تحديث الموافقة
        driver = await prisma.driver.update({
            where: { id: driver.id },
            data: { isApproved: true },
        });
        console.log("ℹ️  Driver profile already exists (updated approval):");
    }
    console.log(`   ID: ${driver.id}`);
    console.log(`   License: ${driver.licenseNumber}`);
    console.log(`   Car: ${driver.carModel}`);
    console.log(`   Plate: ${driver.carPlate}`);
    console.log(`   Approved: ${driver.isApproved}\n`);

    // 4. إنشاء سائق ثاني للاختبار
    const driver2Phone = "+963933333333";
    let driver2User = await prisma.user.findUnique({
        where: { phone: driver2Phone },
    });

    if (!driver2User) {
        driver2User = await prisma.user.create({
            data: {
                phone: driver2Phone,
                name: "خالد السائق",
                email: "driver2@test.com",
                role: "DRIVER",
                isVerified: true,
            },
        });

        await prisma.driver.create({
            data: {
                userId: driver2User.id,
                licenseNumber: "DL789012",
                carModel: "Hyundai Elantra 2021",
                carPlate: "XYZ 789",
                carColor: "Black",
                carYear: 2021,
                isApproved: true,
                isOnline: false,
                latitude: 33.5102,
                longitude: 36.2913,
                rating: 4.5,
                totalRides: 0,
            },
        });
        console.log("✅ Second driver created:");
        console.log(`   ID: ${driver2User.id}`);
        console.log(`   Phone: ${driver2Phone}`);
        console.log(`   Name: ${driver2User.name}\n`);
    } else {
        console.log("ℹ️  Second driver already exists\n");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Test Users Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("👤 CLIENT:");
    console.log(`   Phone: ${clientPhone}`);
    console.log(`   User ID: ${client.id}`);
    console.log(`   Use this for /test-client page\n`);

    console.log("🚕 DRIVER 1:");
    console.log(`   Phone: ${driverPhone}`);
    console.log(`   User ID: ${driverUser.id}`);
    console.log(`   Use this for /test-driver page\n`);

    console.log("🚕 DRIVER 2:");
    console.log(`   Phone: ${driver2Phone}`);
    console.log(`   User ID: ${driver2User.id}`);
    console.log(`   Use this for testing multiple drivers\n`);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔑 To get JWT tokens:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("1. Send OTP:");
    console.log(`   curl -X POST http://localhost:3000/api/auth/send-otp \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"phone": "${clientPhone}"}'\n`);

    console.log("2. Verify OTP (check console for code):");
    console.log(`   curl -X POST http://localhost:3000/api/auth/verify-otp \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"phone": "${clientPhone}", "code": "YOUR_OTP"}'\n`);

    console.log("Or use the interactive script:");
    console.log("   pnpm test:auth:interactive\n");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Done! You can now test the ride system.");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
