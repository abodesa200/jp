# Auth Module

هذا الـ module مسؤول عن المصادقة (Authentication) باستخدام OTP.

## الهيكل

```
auth/
├── otp.service.ts         # Business logic للـ OTP operations
├── otp.repository.ts      # Database operations للـ OTP
├── otp.schema.ts          # Zod validation schemas
├── otp.utils.ts           # OTP utility functions
├── user.repository.ts     # Database operations للـ users
├── email.service.ts       # Email sending operations
├── utils.ts              # General auth utilities
└── index.ts              # Module exports
```

## Services

### OTP Services

- `sendOtpService(data)` - إرسال OTP code للـ email
- `verifyOtpService(data)` - التحقق من OTP وإنشاء JWT token

## Repository Functions

### OTP Repository
- `findActiveOtp(email)` - البحث عن OTP نشط
- `createOtp(email, hashedCode, expiresAt)` - إنشاء OTP جديد
- `findLatestOtp(email)` - جلب آخر OTP نشط
- `markAsUsed(id)` - تحديد OTP كمستخدم
- `deleteExpired()` - حذف OTPs منتهية الصلاحية

### User Repository
- `findByEmailWithDriver(email)` - البحث عن user مع driver data
- `findByEmail(email)` - البحث عن user
- `findById(id)` - البحث عن user بالـ id
- `createClient(email)` - إنشاء client جديد
- `createDriver(email, driverData)` - إنشاء driver جديد
- `update(id, data)` - تحديث بيانات user

## Utilities

### OTP Utils
- `generateOtpCode()` - توليد OTP code (6 أرقام)
- `hashOtp(code)` - تشفير OTP باستخدام HMAC
- `getOtpExpiryDate()` - حساب تاريخ انتهاء OTP (5 دقائق)
- `getSecondsUntilExpiry(expiresAt)` - حساب الثواني المتبقية
- `isOtpValid(expiresAt, used)` - التحقق من صلاحية OTP

### Auth Utils
- `hashOtp(code)` - تشفير OTP
- `hashPassword(password)` - تشفير password باستخدام bcrypt
- `comparePassword(password, hash)` - مقارنة password

### Email Service
- `sendOtpEmail(email, code)` - إرسال OTP عبر البريد
- `sendWelcomeEmail(email, name)` - إرسال email ترحيبي
- `sendDriverApprovalEmail(email, name)` - إرسال email موافقة driver

## Schemas

### SendOtpDTO
```typescript
{
  email: string;
  appContext: "client" | "driver";
}
```

### VerifyOtpDTO
```typescript
{
  email: string;
  code: string; // 6 digits
  appContext: "client" | "driver";
}
```

## API Routes

- `POST /api/auth/send-otp` - إرسال OTP
- `POST /api/auth/verify-otp` - التحقق من OTP

## Flow

### Send OTP
1. التحقق من driver approval (إذا كان appContext = "driver")
2. منع إرسال OTP جديد إذا كان في OTP نشط
3. توليد OTP code (000000 في development)
4. تشفير وحفظ OTP في database
5. إرسال OTP عبر email

### Verify OTP
1. البحث عن OTP نشط
2. التحقق من صحة الـ code
3. تحديد OTP كمستخدم (atomic operation)
4. إنشاء user جديد إذا لم يكن موجود
5. توليد JWT token
6. إرجاع token و user data

## Security Features

✅ OTP hashing باستخدام HMAC  
✅ Atomic update لمنع الاستخدام المزدوج  
✅ Rate limiting (OTP واحد كل 5 دقائق)  
✅ OTP expiry (5 دقائق)  
✅ Driver approval check  
✅ JWT token (7 days expiry)

## Usage Example

```typescript
import { sendOtpService, verifyOtpService } from "@/server/modules/auth";

// Send OTP
await sendOtpService({
  email: "user@example.com",
  appContext: "client"
});

// Verify OTP
const result = await verifyOtpService({
  email: "user@example.com",
  code: "123456",
  appContext: "client"
});
```
