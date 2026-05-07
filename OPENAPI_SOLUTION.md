# حل توليد OpenAPI تلقائياً

## المشكلة
الطريقة الحالية تتطلب:
1. كتابة route handler في `src/app/api/*/route.ts`
2. كتابة Zod schema في `src/server/modules/*/schema.ts`
3. كتابة OpenAPI registration في `src/server/modules/*/openapi.ts` ← **يدوي ومتعب!**

## الحل المقترح

### الخيار 1: استخدام `next-swagger-doc` (الأسهل)
مكتبة تولد OpenAPI من JSDoc comments مباشرة

**المميزات:**
- ✅ تلقائي 100%
- ✅ ما يحتاج ملفات إضافية
- ✅ يشتغل مع Next.js App Router
- ✅ يدعم Zod validation

**التثبيت:**
```bash
pnpm add next-swagger-doc swagger-ui-react
pnpm add -D @types/swagger-ui-react
```

**الاستخدام:**
```typescript
// src/app/api/rides/route.ts
import { z } from 'zod';

const createRideSchema = z.object({
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropoffLat: z.number(),
  dropoffLng: z.number(),
});

/**
 * @swagger
 * /api/rides:
 *   post:
 *     tags: [Rides]
 *     summary: Create new ride
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRideRequest'
 *     responses:
 *       201:
 *         description: Ride created
 */
export async function POST(req: Request) {
  const body = await req.json();
  const data = createRideSchema.parse(body); // Zod validation
  // ...
}
```

---

### الخيار 2: تحسين النظام الحالي (الأقوى)
نستخدم `zod-to-openapi` بطريقة أذكى

**الفكرة:**
بدل ما نكتب `.openapi.ts` لكل route، نسوي **decorator/helper** يسجل تلقائياً

**مثال:**
```typescript
// src/server/lib/openapi/route-helper.ts
import { registry } from './registry';
import { z } from 'zod';

export function defineRoute<TInput extends z.ZodType, TOutput extends z.ZodType>(config: {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  path: string;
  tags: string[];
  summary: string;
  description?: string;
  auth?: boolean;
  input?: TInput;
  output: TOutput;
  errors?: Record<number, { description: string; schema: z.ZodType }>;
}) {
  // تسجيل تلقائي في registry
  registry.registerPath({
    method: config.method,
    path: config.path,
    tags: config.tags,
    summary: config.summary,
    description: config.description,
    security: config.auth ? [{ bearerAuth: [] }] : undefined,
    request: config.input ? {
      body: {
        content: {
          'application/json': {
            schema: config.input,
          },
        },
      },
    } : undefined,
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: config.output,
          },
        },
      },
      ...Object.entries(config.errors || {}).reduce((acc, [code, error]) => ({
        ...acc,
        [code]: {
          description: error.description,
          content: {
            'application/json': {
              schema: error.schema,
            },
          },
        },
      }), {}),
    },
  });

  return {
    input: config.input,
    output: config.output,
  };
}
```

**الاستخدام:**
```typescript
// src/server/modules/rides/rides.api.ts
import { defineRoute } from '@/server/lib/openapi/route-helper';
import { z } from 'zod';

export const createRideRoute = defineRoute({
  method: 'post',
  path: '/api/rides',
  tags: ['Rides - Passenger'],
  summary: '🧑 Create new ride',
  description: 'Passenger creates a new ride request',
  auth: true,
  input: z.object({
    pickupLat: z.number().openapi({ example: 24.7136 }),
    pickupLng: z.number().openapi({ example: 46.6753 }),
    dropoffLat: z.number().openapi({ example: 24.7736 }),
    dropoffLng: z.number().openapi({ example: 46.7353 }),
    type: z.enum(['STANDARD', 'CARPOOLING']).default('STANDARD'),
  }),
  output: z.object({
    id: z.number(),
    status: z.string(),
    // ...
  }),
  errors: {
    400: {
      description: 'Invalid input',
      schema: z.object({ error: z.string() }),
    },
  },
});

// في route.ts
export async function POST(req: Request) {
  const body = await req.json();
  const data = createRideRoute.input.parse(body);
  // ...
}
```

---

### الخيار 3: استخدام `@ts-rest/core` (الأحدث)
مكتبة حديثة تجمع بين type-safety و OpenAPI

**المميزات:**
- ✅ Type-safe من الـ client للـ server
- ✅ توليد OpenAPI تلقائي
- ✅ توليد React Query hooks تلقائي
- ✅ يدعم Zod

**التثبيت:**
```bash
pnpm add @ts-rest/core @ts-rest/next @ts-rest/open-api
```

**الاستخدام:**
```typescript
// src/server/contracts/rides.contract.ts
import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const ridesContract = c.router({
  createRide: {
    method: 'POST',
    path: '/api/rides',
    summary: 'Create new ride',
    body: z.object({
      pickupLat: z.number(),
      pickupLng: z.number(),
      dropoffLat: z.number(),
      dropoffLng: z.number(),
    }),
    responses: {
      201: z.object({
        id: z.number(),
        status: z.string(),
      }),
    },
  },
  getRides: {
    method: 'GET',
    path: '/api/rides',
    summary: 'Get my rides',
    responses: {
      200: z.array(z.object({
        id: z.number(),
        status: z.string(),
      })),
    },
  },
});

// توليد OpenAPI
import { generateOpenApi } from '@ts-rest/open-api';

const openApiDoc = generateOpenApi(ridesContract, {
  info: {
    title: 'Ride Sharing API',
    version: '1.0.0',
  },
});
```

---

## التوصية النهائية

**للمشروع الحالي:**
استخدم **الخيار 2** (تحسين النظام الحالي) لأنه:
1. ✅ يبني على ما عندك (zod-to-openapi موجود)
2. ✅ ما يحتاج تغيير كبير
3. ✅ يخليك تكتب schema مرة واحدة
4. ✅ يولد OpenAPI تلقائياً

**للمشاريع الجديدة:**
استخدم **الخيار 3** (@ts-rest) لأنه الأحدث والأقوى

---

## خطة التنفيذ (الخيار 2)

### المرحلة 1: إنشاء Helper
1. ✅ إنشاء `src/server/lib/openapi/route-helper.ts`
2. ✅ إنشاء `defineRoute` function

### المرحلة 2: تحويل Routes الموجودة
1. تحويل `auth` routes
2. تحويل `rides` routes
3. تحويل `drivers` routes
4. تحويل `profile` routes
5. تحويل `admin` routes

### المرحلة 3: Automation
1. إنشاء script يمسح كل `route.ts` files
2. يستخرج الـ schemas
3. يولد OpenAPI تلقائياً

---

## مثال كامل

### قبل (الطريقة الحالية):
```
src/server/modules/auth/
├── otp.schema.ts       ← Zod schemas
├── otp.openapi.ts      ← OpenAPI registration (يدوي!)
└── ...

src/app/api/auth/send-otp/
└── route.ts            ← Route handler
```

### بعد (الطريقة الجديدة):
```
src/server/modules/auth/
├── auth.api.ts         ← كل شي في ملف واحد!
└── ...

src/app/api/auth/send-otp/
└── route.ts            ← Route handler (يستخدم auth.api.ts)
```

**auth.api.ts:**
```typescript
import { defineRoute } from '@/server/lib/openapi/route-helper';
import { z } from 'zod';

export const sendOtpRoute = defineRoute({
  method: 'post',
  path: '/api/auth/send-otp',
  tags: ['Authentication'],
  summary: 'Send OTP to email',
  input: z.object({
    email: z.string().email(),
    appContext: z.enum(['client', 'driver']),
  }),
  output: z.object({
    success: z.boolean(),
    expiresInSeconds: z.number(),
  }),
});

export const verifyOtpRoute = defineRoute({
  method: 'post',
  path: '/api/auth/verify-otp',
  tags: ['Authentication'],
  summary: 'Verify OTP and get JWT',
  input: z.object({
    email: z.string().email(),
    code: z.string().length(6),
    appContext: z.enum(['client', 'driver']),
  }),
  output: z.object({
    success: z.boolean(),
    token: z.string(),
    user: z.object({
      id: z.number(),
      email: z.string(),
      role: z.string(),
    }),
  }),
});
```

**route.ts:**
```typescript
import { sendOtpRoute } from '@/server/modules/auth/auth.api';

export async function POST(req: Request) {
  const body = await req.json();
  const data = sendOtpRoute.input.parse(body); // Zod validation
  
  // Business logic...
  
  return Response.json({
    success: true,
    expiresInSeconds: 300,
  });
}
```

---

## الخلاصة

| الخيار | السهولة | القوة | التوافق | التوصية |
|--------|---------|-------|---------|---------|
| next-swagger-doc | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | للمشاريع البسيطة |
| تحسين النظام الحالي | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **للمشروع الحالي** ✅ |
| @ts-rest | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | للمشاريع الجديدة |

**القرار:** نستخدم **الخيار 2** ونبني helper قوي يخلي الشغل سلس!
