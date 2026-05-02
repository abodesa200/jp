# Email-Based Authentication API

## نظرة عامة

تم تحديث نظام المصادقة ليستخدم البريد الإلكتروني بدلاً من رقم الهاتف، مع إرسال رموز التحقق OTP عبر خدمة **Resend**.

---

## 📧 إرسال رمز التحقق (Send OTP)

### Endpoint
```
POST /api/auth/send-otp
```

### Request Body
```json
{
  "email": "user@example.com",
  "context": "client" // أو "driver"
}
```

### Parameters
- **email** (required): البريد الإلكتروني للمستخدم
- **context** (optional): نوع المستخدم
  - `"client"`: مستخدم عادي (افتراضي)
  - `"driver"`: سائق (يتطلب حساب سائق موجود)

### Response (Success)
```json
{
  "success": true,
  "email": "user@example.com",
  "expiresInSeconds": 300
}
```

### Response (Error)
```json
{
  "error": "Invalid email address"
}
```

### Error Codes
- **400**: بريد إلكتروني غير صالح أو سياق غير صحيح
- **404**: لا يوجد حساب سائق لهذا البريد (عند استخدام context: "driver")
- **429**: تم تجاوز الحد الأقصى للمحاولات (3 محاولات كل 10 دقائق)
- **500**: خطأ في الخادم

### Rate Limiting
- الحد الأقصى: **3 رموز OTP كل 10 دقائق** لكل بريد إلكتروني
- عند التجاوز، يتم إرجاع `retryAfterSeconds` في الاستجابة

---

## ✅ التحقق من رمز OTP (Verify OTP)

### Endpoint
```
POST /api/auth/verify-otp
```

### Request Body
```json
{
  "email": "user@example.com",
  "code": "123456",
  "context": "client" // أو "driver"
}
```

### Parameters
- **email** (required): البريد الإلكتروني
- **code** (required): رمز التحقق المكون من 6 أرقام
- **context** (optional): نوع المستخدم

### Response (Success)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "phone": null,
    "name": null,
    "isVerified": true,
    "isDriver": false,
    "driver": null
  }
}
```

### Response (Error)
```json
{
  "error": "Invalid or expired OTP"
}
```

### Error Codes
- **400**: بيانات غير صالحة أو رمز OTP منتهي الصلاحية
- **403**: لا يوجد حساب سائق (عند استخدام context: "driver")
- **500**: خطأ في الخادم

### Behavior
- **للمستخدمين الجدد (client)**: يتم إنشاء حساب تلقائياً
- **للسائقين (driver)**: يجب أن يكون الحساب موجوداً مسبقاً
- **JWT Token**: صالح لمدة 7 أيام

---

## 🔧 إعداد البيئة (Environment Variables)

أضف المتغيرات التالية إلى ملف `.env`:

```env
# Resend API Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev

# JWT Secret
JWT_SECRET=super_long_random_secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database
```

### الحصول على RESEND_API_KEY
1. سجل حساب على [Resend](https://resend.com)
2. اذهب إلى **API Keys** في لوحة التحكم
3. أنشئ مفتاح API جديد
4. انسخ المفتاح وضعه في `.env`

### RESEND_FROM_EMAIL
- استخدم `onboarding@resend.dev` للتطوير
- للإنتاج: استخدم نطاقك الخاص (مثل `noreply@yourdomain.com`)
- يجب التحقق من النطاق في Resend أولاً

---

## 📝 مثال على الاستخدام (Frontend)

### إرسال OTP
```typescript
async function sendOtp(email: string) {
  const response = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, context: 'client' })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error);
  }
  
  return data;
}
```

### التحقق من OTP
```typescript
async function verifyOtp(email: string, code: string) {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, context: 'client' })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error);
  }
  
  // حفظ الـ token
  localStorage.setItem('token', data.token);
  
  return data.user;
}
```

---

## 🔄 الكود القديم (Phone-based)

الكود القديم الذي يستخدم رقم الهاتف تم تعليقه في الملف ويمكن الرجوع إليه عند الحاجة:
- موجود في `src/app/api/auth/send-otp/route.ts`
- الدالة: `POST_PHONE_VERSION`

---

## 🗄️ تغييرات قاعدة البيانات

### OtpCode Model
```prisma
model OtpCode {
  id        Int      @id @default(autoincrement())
  phone     String?  // اختياري الآن
  email     String?  // جديد
  code      String
  expiresAt DateTime
  used      Boolean  @default(false)
  attempts  Int      @default(0)
  createdAt DateTime @default(now())
}
```

### User Model
```prisma
model User {
  id         Int     @id @default(autoincrement())
  phone      String? @unique
  email      String? @unique // يستخدم الآن للمصادقة
  // ...
}
```

---

## 🎨 تصميم البريد الإلكتروني

البريد الإلكتروني المرسل يحتوي على:
- رسالة ترحيبية بالعربية
- رمز OTP بخط كبير وواضح
- تنبيه بأن الرمز صالح لمدة 5 دقائق
- تصميم responsive يعمل على جميع الأجهزة

يمكن تخصيص التصميم في `src/lib/resend.ts`

---

## ⚠️ ملاحظات مهمة

1. **الأمان**: في الإنتاج، يجب تشفير رمز OTP قبل حفظه في قاعدة البيانات
2. **Rate Limiting**: تم تطبيق حد أقصى 3 محاولات كل 10 دقائق
3. **صلاحية OTP**: 5 دقائق فقط
4. **JWT**: صالح لمدة 7 أيام
5. **Resend Limits**: 
   - Free tier: 100 email/day
   - للإنتاج: استخدم خطة مدفوعة

---

## 🧪 اختبار الـ API

### باستخدام cURL

#### 1. إرسال OTP لمستخدم عادي (Client)
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","context":"client"}'
```

**الاستجابة المتوقعة:**
```json
{
  "success": true,
  "email": "test@example.com",
  "expiresInSeconds": 300
}
```

#### 2. إرسال OTP لسائق (Driver)
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@example.com","context":"driver"}'
```

#### 3. التحقق من OTP
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456","context":"client"}'
```

**الاستجابة المتوقعة:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "phone": null,
    "name": null,
    "isVerified": true,
    "isDriver": false,
    "driver": null
  }
}
```

#### 4. اختبار Rate Limiting
```bash
# أرسل 4 طلبات متتالية لنفس البريد
for i in {1..4}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","context":"client"}'
  echo -e "\n---"
done
```

**الاستجابة المتوقعة للطلب الرابع:**
```json
{
  "error": "Too many attempts, try again later",
  "retryAfterSeconds": 600
}
```

#### 5. اختبار بريد إلكتروني غير صالح
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email","context":"client"}'
```

**الاستجابة المتوقعة:**
```json
{
  "error": "Invalid email address"
}
```

#### 6. اختبار OTP منتهي الصلاحية
```bash
# انتظر 5 دقائق بعد إرسال OTP، ثم حاول التحقق
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456","context":"client"}'
```

**الاستجابة المتوقعة:**
```json
{
  "error": "Invalid or expired OTP"
}
```

---

### باستخدام Postman

#### Collection Setup
1. أنشئ Collection جديد باسم "Email Auth API"
2. أضف متغير `baseUrl` = `http://localhost:3000`

#### Test 1: Send OTP - Success
- **Method**: POST
- **URL**: `{{baseUrl}}/api/auth/send-otp`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
    "email": "test@example.com",
    "context": "client"
  }
  ```
- **Tests** (Scripts):
  ```javascript
  pm.test("Status code is 200", function () {
      pm.response.to.have.status(200);
  });

  pm.test("Response has success field", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData.success).to.eql(true);
  });

  pm.test("Response has email field", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData.email).to.eql("test@example.com");
  });

  pm.test("Expires in 300 seconds", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData.expiresInSeconds).to.eql(300);
  });
  ```

#### Test 2: Send OTP - Invalid Email
- **Method**: POST
- **URL**: `{{baseUrl}}/api/auth/send-otp`
- **Body**:
  ```json
  {
    "email": "invalid-email",
    "context": "client"
  }
  ```
- **Tests**:
  ```javascript
  pm.test("Status code is 400", function () {
      pm.response.to.have.status(400);
  });

  pm.test("Error message is correct", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData.error).to.eql("Invalid email address");
  });
  ```

#### Test 3: Verify OTP - Success
- **Method**: POST
- **URL**: `{{baseUrl}}/api/auth/verify-otp`
- **Body**:
  ```json
  {
    "email": "test@example.com",
    "code": "123456",
    "context": "client"
  }
  ```
- **Tests**:
  ```javascript
  pm.test("Status code is 200", function () {
      pm.response.to.have.status(200);
  });

  pm.test("Response has token", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData.token).to.exist;
      // حفظ الـ token للاستخدام في طلبات أخرى
      pm.environment.set("authToken", jsonData.token);
  });

  pm.test("User is verified", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData.user.isVerified).to.eql(true);
  });

  pm.test("Email matches", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData.user.email).to.eql("test@example.com");
  });
  ```

#### Test 4: Verify OTP - Invalid Code
- **Method**: POST
- **URL**: `{{baseUrl}}/api/auth/verify-otp`
- **Body**:
  ```json
  {
    "email": "test@example.com",
    "code": "000000",
    "context": "client"
  }
  ```
- **Tests**:
  ```javascript
  pm.test("Status code is 400", function () {
      pm.response.to.have.status(400);
  });

  pm.test("Error message is correct", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData.error).to.eql("Invalid or expired OTP");
  });
  ```

#### Test 5: Rate Limiting
- **Method**: POST
- **URL**: `{{baseUrl}}/api/auth/send-otp`
- **Body**:
  ```json
  {
    "email": "ratelimit@example.com",
    "context": "client"
  }
  ```
- **Pre-request Script**:
  ```javascript
  // أرسل 3 طلبات قبل هذا الطلب
  const sendOtp = {
    url: pm.environment.get("baseUrl") + "/api/auth/send-otp",
    method: "POST",
    header: {
      "Content-Type": "application/json"
    },
    body: {
      mode: "raw",
      raw: JSON.stringify({
        email: "ratelimit@example.com",
        context: "client"
      })
    }
  };

  // أرسل 3 طلبات
  for (let i = 0; i < 3; i++) {
    pm.sendRequest(sendOtp);
  }
  ```
- **Tests**:
  ```javascript
  pm.test("Status code is 429", function () {
      pm.response.to.have.status(429);
  });

  pm.test("Has retry after seconds", function () {
      var jsonData = pm.response.json();
      pm.expect(jsonData.retryAfterSeconds).to.exist;
      pm.expect(jsonData.retryAfterSeconds).to.be.above(0);
  });
  ```

---

### باستخدام JavaScript/TypeScript (Frontend Testing)

#### ملف اختبار كامل: `test-auth.ts`

```typescript
// test-auth.ts
const API_BASE_URL = "http://localhost:3000";

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
    throw new Error(data.error || "Failed to send OTP");
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
    throw new Error(data.error || "Failed to verify OTP");
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════
// Test Cases
// ═══════════════════════════════════════════════════════════════

async function testSendOtpSuccess() {
  console.log("🧪 Test: Send OTP - Success");
  try {
    const result = await sendOtp("test@example.com", "client");
    console.log("✅ PASSED:", result);
    console.log(`   Email: ${result.email}`);
    console.log(`   Expires in: ${result.expiresInSeconds}s`);
  } catch (error) {
    console.error("❌ FAILED:", error);
  }
  console.log("");
}

async function testSendOtpInvalidEmail() {
  console.log("🧪 Test: Send OTP - Invalid Email");
  try {
    await sendOtp("invalid-email", "client");
    console.error("❌ FAILED: Should have thrown an error");
  } catch (error: any) {
    if (error.message.includes("Invalid email")) {
      console.log("✅ PASSED: Correctly rejected invalid email");
    } else {
      console.error("❌ FAILED:", error);
    }
  }
  console.log("");
}

async function testSendOtpDriverNotFound() {
  console.log("🧪 Test: Send OTP - Driver Not Found");
  try {
    await sendOtp("nonexistent@example.com", "driver");
    console.error("❌ FAILED: Should have thrown an error");
  } catch (error: any) {
    if (error.message.includes("No driver account")) {
      console.log("✅ PASSED: Correctly rejected non-existent driver");
    } else {
      console.error("❌ FAILED:", error);
    }
  }
  console.log("");
}

async function testVerifyOtpSuccess() {
  console.log("🧪 Test: Verify OTP - Success");
  try {
    // أولاً، أرسل OTP
    const sendResult = await sendOtp("verify-test@example.com", "client");
    console.log("   OTP sent to:", sendResult.email);

    // في بيئة التطوير، الكود هو دائماً رقم عشوائي
    // يجب أن تحصل عليه من البريد الإلكتروني أو من console.log
    const code = prompt("Enter the OTP code from your email:") || "123456";

    const verifyResult = await verifyOtp("verify-test@example.com", code, "client");
    console.log("✅ PASSED:", verifyResult);
    console.log(`   Token: ${verifyResult.token.substring(0, 20)}...`);
    console.log(`   User ID: ${verifyResult.user.id}`);
    console.log(`   Verified: ${verifyResult.user.isVerified}`);
  } catch (error) {
    console.error("❌ FAILED:", error);
  }
  console.log("");
}

async function testVerifyOtpInvalidCode() {
  console.log("🧪 Test: Verify OTP - Invalid Code");
  try {
    await sendOtp("invalid-code-test@example.com", "client");
    await verifyOtp("invalid-code-test@example.com", "000000", "client");
    console.error("❌ FAILED: Should have thrown an error");
  } catch (error: any) {
    if (error.message.includes("Invalid or expired")) {
      console.log("✅ PASSED: Correctly rejected invalid code");
    } else {
      console.error("❌ FAILED:", error);
    }
  }
  console.log("");
}

async function testRateLimiting() {
  console.log("🧪 Test: Rate Limiting");
  const testEmail = `ratelimit-${Date.now()}@example.com`;

  try {
    // أرسل 3 طلبات (الحد الأقصى)
    for (let i = 1; i <= 3; i++) {
      await sendOtp(testEmail, "client");
      console.log(`   Request ${i}/3: Success`);
    }

    // الطلب الرابع يجب أن يفشل
    try {
      await sendOtp(testEmail, "client");
      console.error("❌ FAILED: Should have been rate limited");
    } catch (error: any) {
      if (error.message.includes("Too many attempts")) {
        console.log("✅ PASSED: Rate limiting working correctly");
      } else {
        console.error("❌ FAILED:", error);
      }
    }
  } catch (error) {
    console.error("❌ FAILED:", error);
  }
  console.log("");
}

async function testCompleteAuthFlow() {
  console.log("🧪 Test: Complete Authentication Flow");
  const testEmail = `complete-flow-${Date.now()}@example.com`;

  try {
    // 1. إرسال OTP
    console.log("   Step 1: Sending OTP...");
    const sendResult = await sendOtp(testEmail, "client");
    console.log(`   ✓ OTP sent to ${sendResult.email}`);

    // 2. الحصول على الكود (في بيئة الاختبار)
    const code = prompt("Enter the OTP code from your email:") || "123456";

    // 3. التحقق من OTP
    console.log("   Step 2: Verifying OTP...");
    const verifyResult = await verifyOtp(testEmail, code, "client");
    console.log(`   ✓ User verified with ID: ${verifyResult.user.id}`);

    // 4. استخدام الـ token في طلب محمي (مثال)
    console.log("   Step 3: Testing authenticated request...");
    const profileResponse = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: {
        Authorization: `Bearer ${verifyResult.token}`,
      },
    });

    if (profileResponse.ok) {
      console.log("   ✓ Authenticated request successful");
      console.log("✅ PASSED: Complete flow working");
    } else {
      console.log("   ⚠️  Profile endpoint might not exist yet");
      console.log("✅ PASSED: Auth flow completed successfully");
    }
  } catch (error) {
    console.error("❌ FAILED:", error);
  }
  console.log("");
}

// ═══════════════════════════════════════════════════════════════
// Run All Tests
// ═══════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Email-Based Authentication API Tests");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");

  await testSendOtpSuccess();
  await testSendOtpInvalidEmail();
  await testSendOtpDriverNotFound();
  await testVerifyOtpInvalidCode();
  await testRateLimiting();

  // اختبارات تحتاج تفاعل يدوي
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Interactive Tests (require manual input)");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");

  // await testVerifyOtpSuccess();
  // await testCompleteAuthFlow();

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Tests Completed!");
  console.log("═══════════════════════════════════════════════════════════");
}

// تشغيل الاختبارات
if (typeof window !== "undefined") {
  // في المتصفح
  (window as any).runAuthTests = runAllTests;
  console.log("Run tests by calling: runAuthTests()");
} else {
  // في Node.js
  runAllTests();
}
```

#### تشغيل الاختبارات

**في Node.js:**
```bash
npx tsx test-auth.ts
```

**في المتصفح:**
1. افتح Console في DevTools
2. انسخ والصق الكود
3. شغل: `runAuthTests()`

---

### باستخدام Jest (Unit Testing)

#### ملف: `__tests__/auth.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

describe('Email Authentication API', () => {
  describe('POST /api/auth/send-otp', () => {
    it('should send OTP successfully for valid email', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          context: 'client',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.email).toBe('test@example.com');
      expect(data.expiresInSeconds).toBe(300);
    });

    it('should reject invalid email format', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          context: 'client',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email address');
    });

    it('should enforce rate limiting', async () => {
      const email = `ratelimit-${Date.now()}@example.com`;

      // Send 3 requests (max allowed)
      for (let i = 0; i < 3; i++) {
        await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, context: 'client' }),
        });
      }

      // 4th request should be rate limited
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, context: 'client' }),
      });

      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Too many attempts');
      expect(data.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('should reject invalid OTP code', async () => {
      const email = `verify-test-${Date.now()}@example.com`;

      // Send OTP first
      await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, context: 'client' }),
      });

      // Try to verify with wrong code
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: '000000',
          context: 'client',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid or expired OTP');
    });

    it('should reject missing email or code', async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: '',
          code: '',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and code required');
    });
  });
});
```

**تشغيل اختبارات Jest:**
```bash
npm test -- auth.test.ts
```

---

## 📊 Checklist للاختبار الشامل

- [ ] ✅ إرسال OTP لبريد صالح
- [ ] ✅ رفض بريد غير صالح
- [ ] ✅ التحقق من OTP صحيح
- [ ] ✅ رفض OTP خاطئ
- [ ] ✅ رفض OTP منتهي الصلاحية (بعد 5 دقائق)
- [ ] ✅ Rate limiting (3 محاولات / 10 دقائق)
- [ ] ✅ إنشاء مستخدم جديد تلقائياً (client)
- [ ] ✅ رفض سائق غير موجود (driver context)
- [ ] ✅ إرجاع JWT token صحيح
- [ ] ✅ استقبال البريد الإلكتروني فعلياً
- [ ] ✅ تصميم البريد responsive
- [ ] ✅ رسالة خطأ واضحة لكل حالة

---

## 🐛 استكشاف الأخطاء

### المشكلة: لا يصل البريد الإلكتروني

**الحلول:**
1. تحقق من `RESEND_API_KEY` في `.env`
2. تحقق من logs في console:
   ```bash
   npm run dev
   # ابحث عن: "OTP sent to email@example.com: 123456"
   ```
3. تحقق من Resend Dashboard → Logs
4. تأكد من أن البريد ليس في Spam

### المشكلة: Rate Limiting لا يعمل

**الحلول:**
1. تحقق من أن قاعدة البيانات تعمل
2. تحقق من timezone في PostgreSQL
3. امسح OTP codes القديمة:
   ```sql
   DELETE FROM "OtpCode" WHERE "createdAt" < NOW() - INTERVAL '10 minutes';
   ```

### المشكلة: JWT Token غير صالح

**الحلول:**
1. تحقق من `JWT_SECRET` في `.env`
2. تأكد من أن السر طويل بما يكفي (32+ حرف)
3. تحقق من صلاحية الـ token (7 أيام)

---

## 📈 Performance Testing

### اختبار الحمل باستخدام Apache Bench

```bash
# اختبار 100 طلب متزامن
ab -n 100 -c 10 -p otp-payload.json -T application/json \
  http://localhost:3000/api/auth/send-otp
```

**ملف `otp-payload.json`:**
```json
{"email":"loadtest@example.com","context":"client"}
```

### النتائج المتوقعة
- **Response Time**: < 500ms
- **Success Rate**: > 95% (مع rate limiting)
- **Throughput**: 20-50 req/sec

---

## ✅ الخلاصة

الآن لديك نظام مصادقة كامل بالبريد الإلكتروني مع:
- ✅ إرسال OTP عبر Resend
- ✅ Rate limiting
- ✅ JWT authentication
- ✅ اختبارات شاملة
- ✅ توثيق كامل

**الخطوات التالية:**
1. اختبر الـ API محلياً
2. تحقق من استلام البريد الإلكتروني
3. ادمج مع Frontend
4. انشر على Production مع domain مخصص لـ Resend
