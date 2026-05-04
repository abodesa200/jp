# Backend Architecture

## 📁 الهيكلية

```
src/
├── app/
│   └── api/
│       └── rides/
│           └── route.ts          ← Entry point فقط
│
├── server/                        ← Backend Layer الجديد
│   ├── db/
│   │   └── prisma.ts             ← Database connection
│   │
│   ├── modules/                   ← Feature modules
│   │   └── rides/
│   │       ├── ride.controller.ts  ← HTTP handlers
│   │       ├── ride.service.ts     ← Main service (facade)
│   │       ├── ride.repository.ts  ← Database queries
│   │       ├── ride.schema.ts      ← Validation schemas
│   │       ├── ride.types.ts       ← TypeScript types
│   │       ├── services/           ← Sub-services (focused)
│   │       │   ├── ride-create.service.ts
│   │       │   ├── ride-query.service.ts
│   │       │   ├── ride-status.service.ts
│   │       │   └── ride-negotiation.service.ts
│   │       └── utils/              ← Pure utility functions
│   │           ├── ride-calculations.ts
│   │           └── ride-formatter.ts
│   │
│   ├── core/                      ← Core utilities
│   │   ├── errors.ts              ← Error classes
│   │   ├── error-handler.ts       ← Global error handler
│   │   └── response.ts            ← Response helpers
│   │
│   └── lib/                       ← Shared libraries
│       └── auth.ts                ← Authentication
```

## 🎯 المبادئ الأساسية

### 1. Separation of Concerns
كل طبقة لها مسؤولية واضحة:

- **Controller**: يستقبل الـ HTTP requests ويرجع responses
- **Service (Main)**: Facade يوجه للـ sub-services
- **Sub-Services**: كل واحد مسؤول عن feature محدد (create, query, status, etc.)
- **Repository**: يتعامل مع الـ database فقط
- **Utils**: Pure functions (calculations, formatting)
- **Schema**: يتحقق من صحة البيانات (validation)

### 2. Dependency Flow
```
Route → Controller → Service → Repository → Database
```

### 3. Error Handling
جميع الأخطاء تمر عبر `handleApiError` المركزي

## 📝 مثال: Rides Module

### Route (Entry Point)
```typescript
// src/app/api/rides/route.ts
import { rideController } from "@/server/modules/rides/ride.controller";

export async function POST(req: NextRequest) {
  return rideController.createRide(req);
}
```

### Controller (HTTP Layer)
```typescript
// src/server/modules/rides/ride.controller.ts
async createRide(req: NextRequest) {
  const payload = await authenticate(req);
  const data = createRideSchema.parse(await req.json());
  const result = await rideService.createRide(payload.userId, payload.role, data);
  return Response.json(successResponse(result));
}
```

### Service (Main Facade)
```typescript
// src/server/modules/rides/ride.service.ts
export class RideService {
  createRide = createService.createRide;
  getUserRides = queryService.getUserRides;
  acceptRide = statusService.acceptRide;
  // ... delegates to sub-services
}
```

### Sub-Service (Focused Business Logic)
```typescript
// src/server/modules/rides/services/ride-create.service.ts
export async function createRide(userId: number, role: string, data: CreateRideInput) {
  if (role !== "CLIENT") throw new ForbiddenError();
  
  const distance = calculateDistance(...);
  const fare = calculateFare(distance);
  
  const ride = await rideRepository.create({...});
  
  emitSocketEvent("drivers", "ride:created", {...});
  
  return { ride: formatRideDetails(ride) };
}
```

### Repository (Data Layer)
```typescript
// src/server/modules/rides/ride.repository.ts
async create(data: CreateRideData) {
  return prisma.ride.create({ data });
}
```

## ✅ المزايا

1. **Testability**: كل طبقة يمكن اختبارها بشكل مستقل
2. **Maintainability**: الكود منظم وسهل الفهم
3. **Scalability**: سهولة إضافة features جديدة
4. **Reusability**: الـ services يمكن استخدامها من أي مكان
5. **Type Safety**: TypeScript types منفصلة وواضحة

## 🚀 إضافة Module جديد

1. أنشئ مجلد في `src/server/modules/[module-name]/`
2. أضف الملفات:
   - `[module].controller.ts`
   - `[module].service.ts`
   - `[module].repository.ts`
   - `[module].schema.ts`
   - `[module].types.ts`
3. أنشئ الـ route في `src/app/api/[module]/route.ts`
4. استورد الـ controller واستخدمه

## 📚 Best Practices

### Controller
- يجب أن يكون رفيع (thin)
- فقط: authentication, validation, calling service
- لا يحتوي على business logic

### Service
- يحتوي على كل الـ business logic
- يستخدم الـ repository للوصول للبيانات
- يمكن استدعاء services أخرى
- يرمي exceptions عند الأخطاء

### Repository
- فقط database operations
- لا يحتوي على business logic
- يرجع البيانات الخام من الـ database

### Schema
- استخدم Zod للـ validation
- صدّر الـ types من الـ schemas
- schemas منفصلة لكل operation

## 🔄 Migration من الهيكلية القديمة

1. انقل الـ validation schemas إلى `[module].schema.ts`
2. انقل الـ business logic إلى `[module].service.ts`
3. انقل الـ database queries إلى `[module].repository.ts`
4. أنشئ الـ controller
5. حدّث الـ route ليستخدم الـ controller
6. احذف الملفات القديمة

## 🎨 Code Style

- استخدم async/await بدلاً من promises
- استخدم destructuring للـ parameters
- أضف JSDoc comments للـ public methods
- استخدم meaningful names
- اتبع Single Responsibility Principle

## 🧹 Keeping Services Clean

### ❌ Bad: One Large Service File (400+ lines)
```typescript
// ride.service.ts - TOO BIG!
export class RideService {
  async createRide() { /* 50 lines */ }
  async getUserRides() { /* 40 lines */ }
  async acceptRide() { /* 30 lines */ }
  async cancelRide() { /* 30 lines */ }
  async negotiateRide() { /* 80 lines */ }
  async respondToNegotiation() { /* 60 lines */ }
  private calculateDistance() { /* 20 lines */ }
  private calculateFare() { /* 10 lines */ }
  private formatRideDetails() { /* 20 lines */ }
}
```

### ✅ Good: Split into Focused Files
```
rides/
├── ride.service.ts              ← 20 lines (facade only)
├── services/
│   ├── ride-create.service.ts   ← 40 lines (creation logic)
│   ├── ride-query.service.ts    ← 50 lines (queries)
│   ├── ride-status.service.ts   ← 60 lines (status changes)
│   └── ride-negotiation.service.ts ← 120 lines (negotiation)
└── utils/
    ├── ride-calculations.ts     ← 30 lines (pure functions)
    └── ride-formatter.ts        ← 20 lines (formatting)
```

### المزايا:
1. **Easy to Find**: كل feature في ملف خاص
2. **Easy to Test**: اختبار كل ملف بشكل مستقل
3. **Easy to Read**: ملفات صغيرة (< 150 lines)
4. **Easy to Maintain**: تعديل feature واحد بدون لمس الباقي
5. **Reusable**: الـ utils يمكن استخدامها في أي مكان
