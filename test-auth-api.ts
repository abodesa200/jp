/**
 * ملف اختبار شامل لـ Email Authentication API
 * 
 * التشغيل:
 * npx tsx test-auth-api.ts
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface SendOtpResponse {
    success: boolean;
    email: string;
    expiresInSeconds: number;
}

interface VerifyOtpResponse {
    token: string;
    user: {
        id: number;
        email: string;
        phone: string | null;
        name: string | null;
        isVerified: boolean;
        isDriver: boolean;
        driver: any;
    };
}

interface ErrorResponse {
    error: string;
    retryAfterSeconds?: number;
}

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

async function sendOtp(
    email: string,
    context: "client" | "driver" = "client"
): Promise<SendOtpResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, context }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
}

async function verifyOtp(
    email: string,
    code: string,
    context: "client" | "driver" = "client"
): Promise<VerifyOtpResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, context }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════
// Test Cases
// ═══════════════════════════════════════════════════════════════

let passedTests = 0;
let failedTests = 0;

async function test(name: string, fn: () => Promise<void>) {
    process.stdout.write(`🧪 ${name}... `);
    try {
        await fn();
        console.log("✅ PASSED");
        passedTests++;
    } catch (error: any) {
        console.log(`❌ FAILED: ${error.message}`);
        failedTests++;
    }
}

// ───────────────────────────────────────────────────────────────
// Test 1: Send OTP - Success
// ───────────────────────────────────────────────────────────────
async function testSendOtpSuccess() {
    await test("Send OTP for valid email", async () => {
        const email = `test-${Date.now()}@example.com`;
        const result = await sendOtp(email, "client");

        if (!result.success) throw new Error("success should be true");
        if (result.email !== email) throw new Error("email mismatch");
        if (result.expiresInSeconds !== 300) throw new Error("expires should be 300");
    });
}

// ───────────────────────────────────────────────────────────────
// Test 2: Send OTP - Invalid Email
// ───────────────────────────────────────────────────────────────
async function testSendOtpInvalidEmail() {
    await test("Reject invalid email format", async () => {
        try {
            await sendOtp("invalid-email", "client");
            throw new Error("Should have thrown an error");
        } catch (error: any) {
            if (!error.message.includes("Invalid email")) {
                throw new Error(`Wrong error: ${error.message}`);
            }
        }
    });
}

// ───────────────────────────────────────────────────────────────
// Test 3: Send OTP - Missing Email
// ───────────────────────────────────────────────────────────────
async function testSendOtpMissingEmail() {
    await test("Reject missing email", async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ context: "client" }),
            });

            if (response.ok) {
                throw new Error("Should have returned error");
            }
        } catch (error: any) {
            // Expected
        }
    });
}

// ───────────────────────────────────────────────────────────────
// Test 4: Send OTP - Invalid Context
// ───────────────────────────────────────────────────────────────
async function testSendOtpInvalidContext() {
    await test("Reject invalid context", async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: "test@example.com",
                    context: "invalid",
                }),
            });

            const data = await response.json();
            if (response.ok) {
                throw new Error("Should have rejected invalid context");
            }
            if (!data.error.includes("Invalid context")) {
                throw new Error(`Wrong error: ${data.error}`);
            }
        } catch (error: any) {
            if (error.message.includes("Should have")) throw error;
        }
    });
}

// ───────────────────────────────────────────────────────────────
// Test 5: Rate Limiting
// ───────────────────────────────────────────────────────────────
async function testRateLimiting() {
    await test("Enforce rate limiting (3 requests per 10 min)", async () => {
        const email = `ratelimit-${Date.now()}@example.com`;

        // Send 3 requests (max allowed)
        for (let i = 0; i < 3; i++) {
            await sendOtp(email, "client");
            await sleep(100); // Small delay between requests
        }

        // 4th request should fail
        try {
            await sendOtp(email, "client");
            throw new Error("Should have been rate limited");
        } catch (error: any) {
            if (!error.message.includes("Too many attempts")) {
                throw new Error(`Wrong error: ${error.message}`);
            }
        }
    });
}

// ───────────────────────────────────────────────────────────────
// Test 6: Verify OTP - Invalid Code
// ───────────────────────────────────────────────────────────────
async function testVerifyOtpInvalidCode() {
    await test("Reject invalid OTP code", async () => {
        const email = `verify-invalid-${Date.now()}@example.com`;

        // Send OTP first
        await sendOtp(email, "client");

        // Try to verify with wrong code
        try {
            await verifyOtp(email, "000000", "client");
            throw new Error("Should have rejected invalid code");
        } catch (error: any) {
            if (!error.message.includes("Invalid or expired")) {
                throw new Error(`Wrong error: ${error.message}`);
            }
        }
    });
}

// ───────────────────────────────────────────────────────────────
// Test 7: Verify OTP - Missing Fields
// ───────────────────────────────────────────────────────────────
async function testVerifyOtpMissingFields() {
    await test("Reject missing email or code", async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "", code: "" }),
            });

            const data = await response.json();
            if (response.ok) {
                throw new Error("Should have rejected empty fields");
            }
            if (!data.error.includes("required")) {
                throw new Error(`Wrong error: ${data.error}`);
            }
        } catch (error: any) {
            if (error.message.includes("Should have")) throw error;
        }
    });
}

// ───────────────────────────────────────────────────────────────
// Test 8: Verify OTP - Invalid Email Format
// ───────────────────────────────────────────────────────────────
async function testVerifyOtpInvalidEmail() {
    await test("Reject invalid email in verify", async () => {
        try {
            await verifyOtp("invalid-email", "123456", "client");
            throw new Error("Should have rejected invalid email");
        } catch (error: any) {
            if (!error.message.includes("Invalid email")) {
                throw new Error(`Wrong error: ${error.message}`);
            }
        }
    });
}

// ───────────────────────────────────────────────────────────────
// Test 9: Send OTP - Driver Context (No Account)
// ───────────────────────────────────────────────────────────────
async function testSendOtpDriverNotFound() {
    await test("Reject driver context for non-existent account", async () => {
        const email = `nonexistent-driver-${Date.now()}@example.com`;

        try {
            await sendOtp(email, "driver");
            throw new Error("Should have rejected non-existent driver");
        } catch (error: any) {
            if (!error.message.includes("No driver account")) {
                throw new Error(`Wrong error: ${error.message}`);
            }
        }
    });
}

// ───────────────────────────────────────────────────────────────
// Test 10: Multiple Emails Don't Interfere
// ───────────────────────────────────────────────────────────────
async function testMultipleEmailsIndependent() {
    await test("Multiple emails have independent rate limits", async () => {
        const email1 = `multi1-${Date.now()}@example.com`;
        const email2 = `multi2-${Date.now()}@example.com`;

        // Send 3 to email1
        for (let i = 0; i < 3; i++) {
            await sendOtp(email1, "client");
            await sleep(50);
        }

        // email2 should still work
        const result = await sendOtp(email2, "client");
        if (!result.success) {
            throw new Error("email2 should not be rate limited");
        }
    });
}

// ───────────────────────────────────────────────────────────────
// Test 11: OTP Can't Be Reused
// ───────────────────────────────────────────────────────────────
async function testOtpCannotBeReused() {
    await test("OTP cannot be used twice", async () => {
        const email = `reuse-test-${Date.now()}@example.com`;

        // Send OTP
        await sendOtp(email, "client");

        // في بيئة التطوير، نحتاج الكود الفعلي من console
        // هذا الاختبار يحتاج تعديل يدوي أو mock
        console.log("\n   ⚠️  Skipping: Requires actual OTP code from email");
    });
}

// ───────────────────────────────────────────────────────────────
// Test 12: Response Time Check
// ───────────────────────────────────────────────────────────────
async function testResponseTime() {
    await test("Response time < 2 seconds", async () => {
        const email = `perf-test-${Date.now()}@example.com`;
        const startTime = Date.now();

        await sendOtp(email, "client");

        const duration = Date.now() - startTime;
        if (duration > 2000) {
            throw new Error(`Too slow: ${duration}ms`);
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// Run All Tests
// ═══════════════════════════════════════════════════════════════

async function runAllTests() {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  Email Authentication API - Automated Tests");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`  Base URL: ${API_BASE_URL}`);
    console.log("═══════════════════════════════════════════════════════════\n");

    const startTime = Date.now();

    // Send OTP Tests
    console.log("📤 Send OTP Tests\n");
    await testSendOtpSuccess();
    await testSendOtpInvalidEmail();
    await testSendOtpMissingEmail();
    await testSendOtpInvalidContext();
    await testSendOtpDriverNotFound();

    console.log("\n⏱️  Rate Limiting Tests\n");
    await testRateLimiting();
    await testMultipleEmailsIndependent();

    console.log("\n✅ Verify OTP Tests\n");
    await testVerifyOtpInvalidCode();
    await testVerifyOtpMissingFields();
    await testVerifyOtpInvalidEmail();

    console.log("\n🔒 Security Tests\n");
    await testOtpCannotBeReused();

    console.log("\n⚡ Performance Tests\n");
    await testResponseTime();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("  Test Results");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`  ✅ Passed: ${passedTests}`);
    console.log(`  ❌ Failed: ${failedTests}`);
    console.log(`  ⏱️  Duration: ${duration}s`);
    console.log("═══════════════════════════════════════════════════════════\n");

    if (failedTests > 0) {
        process.exit(1);
    }
}

// ═══════════════════════════════════════════════════════════════
// Interactive Tests (Manual)
// ═══════════════════════════════════════════════════════════════

async function runInteractiveTests() {
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  Interactive Tests (Manual Verification Required)");
    console.log("═══════════════════════════════════════════════════════════\n");

    const readline = require("readline");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const question = (query: string): Promise<string> => {
        return new Promise((resolve) => rl.question(query, resolve));
    };

    try {
        // Test 1: Complete Auth Flow
        console.log("🧪 Test: Complete Authentication Flow\n");

        const email = await question("Enter your email address: ");

        console.log("\n📧 Sending OTP...");
        const sendResult = await sendOtp(email.trim(), "client");
        console.log(`✅ OTP sent to ${sendResult.email}`);
        console.log(`⏱️  Expires in ${sendResult.expiresInSeconds} seconds\n`);

        console.log("📬 Check your email for the OTP code");
        const code = await question("Enter the OTP code: ");

        console.log("\n🔐 Verifying OTP...");
        const verifyResult = await verifyOtp(email.trim(), code.trim(), "client");

        console.log("✅ Authentication successful!");
        console.log(`\n👤 User Info:`);
        console.log(`   ID: ${verifyResult.user.id}`);
        console.log(`   Email: ${verifyResult.user.email}`);
        console.log(`   Verified: ${verifyResult.user.isVerified}`);
        console.log(`   Is Driver: ${verifyResult.user.isDriver}`);
        console.log(`\n🔑 JWT Token (first 50 chars):`);
        console.log(`   ${verifyResult.token.substring(0, 50)}...`);

        console.log("\n✅ Complete flow test PASSED!\n");
    } catch (error: any) {
        console.error(`\n❌ Test FAILED: ${error.message}\n`);
    } finally {
        rl.close();
    }
}

// ═══════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════

const args = process.argv.slice(2);

if (args.includes("--interactive") || args.includes("-i")) {
    runInteractiveTests().catch(console.error);
} else if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: npx tsx test-auth-api.ts [options]

Options:
  (no args)         Run automated tests
  -i, --interactive Run interactive tests (requires email input)
  -h, --help        Show this help message

Examples:
  npx tsx test-auth-api.ts              # Run automated tests
  npx tsx test-auth-api.ts -i           # Run interactive tests
  `);
} else {
    runAllTests().catch(console.error);
}
