# 🚀 دليل الانتقال للهيكلية الجديدة

## 📋 نظرة عامة

تم إعادة هيكلة الـ Backend لتحسين:
- **الفصل بين الطبقات** (Separation of Concerns)
- **قابلية الاختبار** (Testability)
- **قابلية التوسع** (Scalability)
- **الصيانة** (Maintainability)

## 🏗️ الهيكلية الجديدة

### قبل (Old Structure)
```
src/
├── app/api/rides/route.ts        ← كل شيء في ملف واحد
├── services/rides/
│   ├── ride-create.service.ts
│   ├── ride-query.service.ts
│   └── ride.schema.ts
```

### بعد (New Structure)
```
src/
├── app/api/rides/route.ts        ← Entry point فقط
├── server/
│   ├── modules/rides/
│   │   ├── ride.controller.ts    ← HTTP handlers
│   │   ├── ride.service.ts       ← Business logic
│   │   ├── ride.repository.ts    ← Database queries
│   │   ├── ride.schema.ts        ← Validation
│   │   └── ride.types.ts         ← Types
│   ├── core/
│   │   ├── errors.ts
│   │   ├── error-handler.ts
│   │   └── response.ts
│   └── lib/
│       └── auth.ts
```

## ✅ ما تم إنجازه

### 1. Core Infrastructure
- ✅ `src/server/core/errors.ts` - Error classes
- ✅ `src/server/core/error-handler.ts` - Global error handler
- ✅ `src/server/core/response.ts` - Response helpers
- ✅ `src/server/db/prisma.ts` - Database connection
- ✅ `src/server/lib/auth.ts` - Authentication utilities

### 2. Rides Module (مثال كامل)
- ✅ `ride.controller.ts` - HTTP request handlers
- ✅ `ride.service.ts` - Business logic
- ✅ `ride.repository.ts` - Database operations
- ✅ `ride.schema.ts` - Validation schemas
- ✅ `ride.types.ts` - TypeScript types

### 3. Updated Routes
- ✅ `src/app/api/rides/route.ts`
- ✅ `src/app/api/rides/[id]/accept/route.ts`

## 📝 خطوات الانتقال للـ Modules الأخرى

### 1. Users Module

#### الملفات المطلوبة:
```
src/server/modules/users/
├── user.controller.ts
├── user.service.ts
├── user.repository.ts
├── user.schema.ts
└── user.types.ts
```

#### مثال:
```typescript
// user.service.ts
export class UserService {
  async getUsers(query: GetUsersQuery) {
    return userRepository.findAll(query);
  }
  
  async getUserById(id: number) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");
    return user;
  }
}
```

### 2. Drivers Module

#### الملفات المطلوبة:
```
src/server/modules/drivers/
├── driver.controller.ts
├── driver.service.ts
├── driver.repository.ts
├── driver.schema.ts
└── driver.types.ts
```

### 3. Admin Module

#### الملفات المطلوبة:
```
src/server/modules/admin/
├── admin.controller.ts
├── admin.service.ts
├── admin.repository.ts
├── admin.schema.ts
└── admin.types.ts
```

## 🔄 خطوات Migration لكل Module

### الخطوة 1: إنشاء الـ Types
```typescript
// src/server/modules/[module]/[module].types.ts
export interface CreateUserInput {
  name: string;
  email: string;
  phone?: string;
}

export interface GetUsersQuery {
  page?: number;
  limit?: number;
  role?: string;
}
```

### الخطوة 2: إنشاء الـ Schema
```typescript
// src/server/modules/[module]/[module].schema.ts
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;
```

### الخطوة 3: إنشاء الـ Repository
```typescript
// src/server/modules/[module]/[module].repository.ts
import { prisma } from "../../db/prisma";

export class UserRepository {
  async create(data: CreateUserData) {
    return prisma.user.create({ data });
  }
  
  async findById(id: number) {
    return prisma.user.findUnique({ where: { id } });
  }
  
  async findAll(query: GetUsersQuery) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({ skip, take: limit }),
      prisma.user.count(),
    ]);
    
    return { users, total, page, limit };
  }
}

export const userRepository = new UserRepository();
```

### الخطوة 4: إنشاء الـ Service
```typescript
// src/server/modules/[module]/[module].service.ts
import { NotFoundError } from "../../core/errors";
import { userRepository } from "./user.repository";

export class UserService {
  async createUser(data: CreateUserInput) {
    // Business logic here
    return userRepository.create(data);
  }
  
  async getUsers(query: GetUsersQuery) {
    return userRepository.findAll(query);
  }
  
  async getUserById(id: number) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");
    return user;
  }
}

export const userService = new UserService();
```

### الخطوة 5: إنشاء الـ Controller
```typescript
// src/server/modules/[module]/[module].controller.ts
import { NextRequest } from "next/server";
import { authenticate } from "../../lib/auth";
import { handleApiError } from "../../core/error-handler";
import { successResponse } from "../../core/response";
import { userService } from "./user.service";
import { createUserSchema } from "./user.schema";

export class UserController {
  async createUser(req: NextRequest) {
    try {
      const payload = await authenticate(req);
      const body = await req.json();
      const data = createUserSchema.parse(body);
      
      const result = await userService.createUser(data);
      
      return Response.json(successResponse(result));
    } catch (error) {
      return handleApiError(error);
    }
  }
  
  async getUsers(req: NextRequest) {
    try {
      const payload = await authenticate(req);
      const { searchParams } = new URL(req.url);
      
      const query = {
        page: Number(searchParams.get("page")) || 1,
        limit: Number(searchParams.get("limit")) || 10,
      };
      
      const result = await userService.getUsers(query);
      
      return Response.json(successResponse(result.users, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      }));
    } catch (error) {
      return handleApiError(error);
    }
  }
}

export const userController = new UserController();
```

### الخطوة 6: تحديث الـ Route
```typescript
// src/app/api/users/route.ts
import { NextRequest } from "next/server";
import { userController } from "@/server/modules/users/user.controller";

export async function POST(req: NextRequest) {
  return userController.createUser(req);
}

export async function GET(req: NextRequest) {
  return userController.getUsers(req);
}
```

## 🎯 أولويات الانتقال

### المرحلة 1 (تم ✅)
- [x] Core infrastructure
- [x] Rides module
- [x] Documentation

### المرحلة 2 (التالي)
- [ ] Users module
- [ ] Auth module
- [ ] Profile module

### المرحلة 3
- [ ] Drivers module
- [ ] Admin module
- [ ] Stats module

### المرحلة 4
- [ ] حذف الملفات القديمة
- [ ] تحديث الـ imports في كل المشروع
- [ ] Testing

## 🧪 Testing Strategy

### Unit Tests
```typescript
// ride.service.test.ts
describe("RideService", () => {
  it("should create a ride", async () => {
    const result = await rideService.createRide(1, "CLIENT", {
      pickupLat: 24.7136,
      pickupLng: 46.6753,
      // ...
    });
    
    expect(result.ride).toBeDefined();
  });
});
```

### Integration Tests
```typescript
// ride.controller.test.ts
describe("POST /api/rides", () => {
  it("should create a ride", async () => {
    const response = await fetch("/api/rides", {
      method: "POST",
      headers: {
        "Authorization": "Bearer token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pickupLat: 24.7136,
        // ...
      }),
    });
    
    expect(response.status).toBe(200);
  });
});
```

## 📚 Resources

- [Architecture README](./src/server/README.md)
- [Rides Module Example](./src/server/modules/rides/)
- [Error Handling](./src/server/core/errors.ts)

## 💡 Tips

1. **ابدأ بـ module صغير** للتعود على الهيكلية
2. **اختبر كل طبقة بشكل مستقل** قبل الانتقال للتالية
3. **استخدم الـ types بشكل صارم** لتجنب الأخطاء
4. **اتبع الـ naming conventions** الموجودة
5. **أضف JSDoc comments** للـ public methods

## ❓ أسئلة شائعة

### Q: هل يجب نقل كل الـ modules دفعة واحدة؟
A: لا، يمكن النقل تدريجياً. الهيكلية القديمة والجديدة يمكن أن تعمل معاً.

### Q: ماذا عن الـ Socket.IO code؟
A: يبقى في `src/lib/socket/` ويتم استدعاؤه من الـ services.

### Q: كيف أتعامل مع الـ shared utilities؟
A: ضعها في `src/server/lib/` أو `src/server/core/`.

### Q: هل الـ Prisma client يتغير؟
A: نعم، استخدم `src/server/db/prisma.ts` بدلاً من `src/lib/prisma.ts`.

## 🎉 الخلاصة

الهيكلية الجديدة توفر:
- ✅ كود أنظف وأسهل للفهم
- ✅ سهولة في الاختبار
- ✅ قابلية للتوسع
- ✅ صيانة أفضل
- ✅ فصل واضح بين الطبقات

**ابدأ الآن بنقل module واحد وشوف الفرق! 🚀**
