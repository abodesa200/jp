# دليل العمل مع @ts-rest

## 📋 الفكرة الأساسية

بدل ما تكتب:
1. ❌ Route handler في `route.ts`
2. ❌ Zod schema في `schema.ts`
3. ❌ OpenAPI registration في `openapi.ts`
4. ❌ API client في Frontend
5. ❌ TypeScript types يدوياً

**مع @ts-rest:**
✅ تكتب **Contract واحد** - وكل شي يتولد تلقائياً!

---

## 🏗️ البنية الجديدة

```
src/
├── contracts/                    ← جديد! كل الـ API contracts هنا
│   ├── auth.contract.ts         ← Authentication APIs
│   ├── rides.contract.ts        ← Rides APIs
│   ├── drivers.contract.ts      ← Drivers APIs
│   ├── profile.contract.ts      ← Profile APIs
│   ├── admin.contract.ts        ← Admin APIs
│   └── index.ts                 ← Main contract (يجمع كل شي)
│
├── app/api/                      ← Routes (بس implementation)
│   └── [...ts-rest]/
│       └── route.ts             ← Handler واحد لكل الـ APIs!
│
├── lib/
│   ├── api-client.ts            ← Frontend client (type-safe)
│   └── api-server.ts            ← Backend router
│
└── server/
    └── lib/
        └── openapi/
            └── generator.ts      ← OpenAPI generator (محدّث)
```

---

## 📝 مثال عملي: Authentication Contract

### 1️⃣ إنشاء Contract

```typescript
// src/contracts/auth.contract.ts
import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

// ─────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────

const sendOtpSchema = z.object({
  email: z.string().email(),
  appContext: z.enum(['client', 'driver']),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  appContext: z.enum(['client', 'driver']),
});

const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  role: z.enum(['CLIENT', 'DRIVER', 'ADMIN', 'CUSTOMER_SUPPORT']),
  isVerified: z.boolean(),
});

const errorSchema = z.object({
  error: z.string(),
});

// ─────────────────────────────────────────────
// Contract
// ─────────────────────────────────────────────

export const authContract = c.router({
  sendOtp: {
    method: 'POST',
    path: '/api/auth/send-otp',
    summary: 'Send OTP to email',
    description: 'Send OTP verification code via email',
    body: sendOtpSchema,
    responses: {
      200: z.object({
        success: z.boolean(),
        expiresInSeconds: z.number(),
      }),
      400: errorSchema,
      403: errorSchema,
      404: errorSchema,
      429: z.object({
        error: z.string(),
        retryAfterSeconds: z.number(),
      }),
    },
  },

  verifyOtp: {
    method: 'POST',
    path: '/api/auth/verify-otp',
    summary: 'Verify OTP and get JWT',
    description: 'Verify OTP code and get JWT token',
    body: verifyOtpSchema,
    responses: {
      200: z.object({
        success: z.boolean(),
        token: z.string(),
        user: userSchema,
      }),
      400: errorSchema,
      403: errorSchema,
    },
  },
});
```

---

### 2️⃣ Backend Implementation

```typescript
// src/app/api/[...ts-rest]/route.ts
import { createNextRoute } from '@ts-rest/next';
import { contract } from '@/contracts';
import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/server/lib/email';

const router = createNextRoute(contract, {
  // ─────────────────────────────────────────────
  // Auth Routes
  // ─────────────────────────────────────────────
  auth: {
    sendOtp: async ({ body }) => {
      // body هنا type-safe تلقائياً! ✅
      const { email, appContext } = body;

      // Business logic...
      const otp = generateOTP();
      await prisma.oTP.create({
        data: { email, code: otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) }
      });
      await sendOtpEmail(email, otp);

      // Response type-safe تلقائياً! ✅
      return {
        status: 200,
        body: {
          success: true,
          expiresInSeconds: 300,
        },
      };
    },

    verifyOtp: async ({ body }) => {
      const { email, code, appContext } = body;

      // Verify OTP...
      const otp = await prisma.oTP.findFirst({
        where: { email, code, expiresAt: { gt: new Date() } }
      });

      if (!otp) {
        return {
          status: 400,
          body: { error: 'Invalid or expired OTP' },
        };
      }

      // Create/get user...
      const user = await getOrCreateUser(email, appContext);
      const token = await generateJWT(user);

      return {
        status: 200,
        body: {
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email!,
            role: user.role,
            isVerified: user.isVerified,
          },
        },
      };
    },
  },

  // ─────────────────────────────────────────────
  // Rides Routes
  // ─────────────────────────────────────────────
  rides: {
    create: async ({ body, headers }) => {
      // Authentication
      const user = await getUserFromToken(headers.authorization);
      
      // Create ride...
      const ride = await prisma.ride.create({
        data: {
          clientId: user.id,
          pickupLat: body.pickupLat,
          pickupLng: body.pickupLng,
          dropoffLat: body.dropoffLat,
          dropoffLng: body.dropoffLng,
          type: body.type || 'STANDARD',
          status: 'REQUESTED',
        },
      });

      return {
        status: 201,
        body: ride,
      };
    },

    getMyRides: async ({ query, headers }) => {
      const user = await getUserFromToken(headers.authorization);
      
      const rides = await prisma.ride.findMany({
        where: { clientId: user.id },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });

      return {
        status: 200,
        body: { rides, total: rides.length },
      };
    },
  },
});

export const { GET, POST, PUT, DELETE, PATCH } = router;
```

---

### 3️⃣ Frontend Usage (Type-Safe!)

```typescript
// src/lib/api-client.ts
import { initClient } from '@ts-rest/core';
import { contract } from '@/contracts';

export const apiClient = initClient(contract, {
  baseUrl: 'http://localhost:3000',
  baseHeaders: {},
});

// ─────────────────────────────────────────────
// في أي Component
// ─────────────────────────────────────────────

// مثال 1: Send OTP
const handleSendOtp = async () => {
  const { status, body } = await apiClient.auth.sendOtp({
    body: {
      email: 'user@example.com',
      appContext: 'client',
    },
  });

  if (status === 200) {
    console.log('OTP sent!', body.expiresInSeconds);
    // TypeScript يعرف أن body.expiresInSeconds موجود! ✅
  } else if (status === 429) {
    console.log('Rate limited:', body.retryAfterSeconds);
    // TypeScript يعرف أن body.retryAfterSeconds موجود! ✅
  }
};

// مثال 2: Create Ride
const handleCreateRide = async () => {
  const { status, body } = await apiClient.rides.create({
    body: {
      pickupLat: 24.7136,
      pickupLng: 46.6753,
      dropoffLat: 24.7736,
      dropoffLng: 46.7353,
      type: 'STANDARD',
    },
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  if (status === 201) {
    console.log('Ride created:', body.id);
    // body هنا type-safe تلقائياً! ✅
  }
};
```

---

### 4️⃣ React Query Integration (Optional)

```typescript
// src/lib/api-hooks.ts
import { initQueryClient } from '@ts-rest/react-query';
import { contract } from '@/contracts';

export const apiHooks = initQueryClient(contract, {
  baseUrl: 'http://localhost:3000',
  baseHeaders: {},
});

// ─────────────────────────────────────────────
// في Component
// ─────────────────────────────────────────────

function MyRidesPage() {
  // Hook جاهز مع loading, error, refetch, etc.
  const { data, isLoading, error } = apiHooks.rides.getMyRides.useQuery({
    queryKey: ['my-rides'],
    queryData: {
      query: { page: 1, limit: 20 },
      headers: { authorization: `Bearer ${token}` },
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.body.rides.map(ride => (
        <div key={ride.id}>{ride.status}</div>
      ))}
    </div>
  );
}

// Mutation مع React Query
function CreateRideForm() {
  const createRide = apiHooks.rides.create.useMutation();

  const handleSubmit = () => {
    createRide.mutate({
      body: {
        pickupLat: 24.7136,
        pickupLng: 46.6753,
        dropoffLat: 24.7736,
        dropoffLng: 46.7353,
      },
    });
  };

  return (
    <button onClick={handleSubmit} disabled={createRide.isLoading}>
      {createRide.isLoading ? 'Creating...' : 'Create Ride'}
    </button>
  );
}
```

---

### 5️⃣ OpenAPI Generation (تلقائي!)

```typescript
// src/server/lib/openapi/generator.ts
import { generateOpenApi } from '@ts-rest/open-api';
import { contract } from '@/contracts';

export function generateOpenApiSpec() {
  return generateOpenApi(
    contract,
    {
      info: {
        title: 'Ride Sharing API',
        version: '1.0.0',
        description: 'API documentation for the ride sharing platform',
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Local development' },
        { url: 'https://your-production-url.com', description: 'Production' },
      ],
    },
    {
      setOperationId: true, // يضيف operationId لكل endpoint
      operationMapper: (operation, route) => ({
        ...operation,
        tags: [route.path.split('/')[2]], // Auto-tag based on path
      }),
    }
  );
}

// ─────────────────────────────────────────────
// Endpoint لعرض OpenAPI
// ─────────────────────────────────────────────

// src/app/api/openapi/route.ts
import { generateOpenApiSpec } from '@/server/lib/openapi/generator';

export async function GET() {
  const spec = generateOpenApiSpec();
  return Response.json(spec);
}
```

---

## 🎯 المميزات

### ✅ Type-Safety كاملة
```typescript
// ❌ قبل: أي خطأ ما ينكشف إلا runtime
const response = await fetch('/api/rides', {
  method: 'POST',
  body: JSON.stringify({ pickupLat: '24.7' }), // خطأ! string بدل number
});

// ✅ بعد: TypeScript يكشف الخطأ قبل ما تشغل!
const { body } = await apiClient.rides.create({
  body: { pickupLat: '24.7' }, // ❌ TypeScript Error!
});
```

### ✅ Auto-completion
```typescript
// IDE يعطيك suggestions تلقائياً
apiClient.rides. // ← يطلع لك: create, getMyRides, getNearby, etc.
```

### ✅ Refactoring آمن
```typescript
// لو غيرت اسم field في Contract
// TypeScript يعطيك errors في كل مكان يستخدمه
// ما تنسى ولا مكان!
```

### ✅ OpenAPI تلقائي
- ما تكتب ولا سطر OpenAPI يدوي
- يتولد من الـ Contract مباشرة
- دايماً متزامن مع الكود

### ✅ Documentation تلقائي
```typescript
// أي comment تكتبه في Contract
// يظهر في OpenAPI و IDE tooltips
sendOtp: {
  summary: 'Send OTP to email', // ← يظهر في Postman!
  description: 'Sends verification code...', // ← يظهر في Swagger!
}
```

---

## 📊 المقارنة

| الميزة | قبل (الطريقة اليدوية) | بعد (@ts-rest) |
|--------|----------------------|----------------|
| عدد الملفات لكل endpoint | 3-4 ملفات | 1 ملف (Contract) |
| Type-Safety | ❌ يدوي | ✅ تلقائي |
| OpenAPI | ❌ يدوي | ✅ تلقائي |
| Frontend Client | ❌ يدوي | ✅ تلقائي |
| React Query Hooks | ❌ يدوي | ✅ تلقائي |
| Refactoring | ⚠️ خطر | ✅ آمن |
| وقت التطوير | بطيء | سريع جداً |

---

## 🚀 خطة التنفيذ

### المرحلة 1: Setup (10 دقائق)
1. ✅ تثبيت المكتبات
2. ✅ إنشاء بنية المجلدات
3. ✅ إنشاء Main Contract

### المرحلة 2: تحويل Auth (20 دقيقة)
1. ✅ إنشاء `auth.contract.ts`
2. ✅ تحويل `/api/auth/send-otp`
3. ✅ تحويل `/api/auth/verify-otp`
4. ✅ اختبار

### المرحلة 3: تحويل Rides (30 دقيقة)
1. ✅ إنشاء `rides.contract.ts`
2. ✅ تحويل كل rides endpoints
3. ✅ اختبار

### المرحلة 4: تحويل باقي الـ APIs (حسب الحاجة)
- Drivers
- Profile
- Admin
- Notifications
- Support

### المرحلة 5: Frontend Integration
1. ✅ إنشاء API Client
2. ✅ إنشاء React Query Hooks
3. ✅ استخدام في Components

---

## 💡 نصائح

### 1. ابدأ صغير
- حوّل Auth أول شي
- اختبره كويس
- بعدين حوّل باقي الـ APIs

### 2. استخدم Shared Schemas
```typescript
// src/contracts/schemas/common.ts
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  // ...
});

// استخدمه في كل مكان
import { userSchema } from './schemas/common';
```

### 3. استخدم Middleware للـ Auth
```typescript
// src/lib/api-middleware.ts
export const requireAuth = async (headers: Headers) => {
  const token = headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Unauthorized');
  return await verifyJWT(token);
};

// في Route Handler
rides: {
  create: async ({ body, headers }) => {
    const user = await requireAuth(headers); // ✅ Reusable!
    // ...
  },
}
```

---

## ❓ أسئلة شائعة

**Q: شو يصير للـ routes الموجودة؟**
A: نحولها تدريجياً. الـ routes القديمة تشتغل عادي لحد ما نحولها.

**Q: لازم أحول كل شي مرة وحدة؟**
A: لا! حوّل endpoint واحد، اختبره، بعدين كمل.

**Q: شو يصير لو بدي أضيف endpoint جديد؟**
A: بس أضيفه في Contract - كل شي تاني تلقائي!

**Q: بشتغل مع Mobile App؟**
A: نعم! نفس الـ Contract يشتغل مع React Native.

---

## 🎉 الخلاصة

**قبل:**
```
1. كتابة Schema ✍️
2. كتابة OpenAPI ✍️
3. كتابة Route Handler ✍️
4. كتابة Frontend Client ✍️
5. كتابة Types ✍️
= 5 خطوات يدوية! 😫
```

**بعد:**
```
1. كتابة Contract ✍️
= خطوة وحدة! 🎉
```

**كل شي تاني تلقائي! ✨**

---

بدك نبدأ التنفيذ؟ 🚀
