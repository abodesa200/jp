# 🚗 Rides Module

## 📁 الهيكلية النظيفة

```
rides/
├── ride.controller.ts           ← HTTP layer (80 lines)
├── ride.service.ts              ← Main facade (20 lines) ✨
├── ride.repository.ts           ← Database layer (100 lines)
├── ride.schema.ts               ← Validation (40 lines)
├── ride.types.ts                ← TypeScript types (30 lines)
│
├── services/                    ← Sub-services (focused)
│   ├── ride-create.service.ts   ← 40 lines
│   ├── ride-query.service.ts    ← 50 lines
│   ├── ride-status.service.ts   ← 60 lines
│   └── ride-negotiation.service.ts ← 120 lines
│
└── utils/                       ← Pure utilities
    ├── ride-calculations.ts     ← 30 lines
    └── ride-formatter.ts        ← 20 lines
```

## 🎯 لماذا هذه الهيكلية؟

### المشكلة القديمة
```typescript
// ❌ ride.service.ts - 450 lines!
export class RideService {
  async createRide() { ... }        // 50 lines
  async getUserRides() { ... }      // 40 lines
  async getRideById() { ... }       // 30 lines
  async acceptRide() { ... }        // 30 lines
  async cancelRide() { ... }        // 30 lines
  async negotiateRide() { ... }     // 80 lines
  async respondToNegotiation() { ... } // 60 lines
  
  // Helper methods
  private calculateDistance() { ... }
  private calculateFare() { ... }
  private formatRideDetails() { ... }
}
```

**المشاكل:**
- 😵 ملف كبير جداً (450+ lines)
- 🔍 صعب تلاقي الـ function اللي بدك إياها
- 🧪 صعب الاختبار
- 🔧 أي تعديل بسيط يفتح ملف ضخم
- 🤝 Merge conflicts كثيرة

### الحل الجديد

#### 1️⃣ Main Service (Facade Pattern)
```typescript
// ✅ ride.service.ts - 20 lines only!
import * as createService from "./services/ride-create.service";
import * as queryService from "./services/ride-query.service";
import * as statusService from "./services/ride-status.service";
import * as negotiationService from "./services/ride-negotiation.service";

export class RideService {
  // Ride Creation
  createRide = createService.createRide;

  // Ride Queries
  getUserRides = queryService.getUserRides;
  getRideById = queryService.getRideById;

  // Ride Status
  acceptRide = statusService.acceptRide;
  cancelRide = statusService.cancelRide;

  // Ride Negotiation
  negotiateRide = negotiationService.negotiateRide;
  respondToNegotiation = negotiationService.respondToNegotiation;
}

export const rideService = new RideService();
```

**المزايا:**
- ✅ ملف صغير جداً (20 lines)
- ✅ واضح ومنظم
- ✅ سهل إضافة features جديدة
- ✅ Single entry point

#### 2️⃣ Sub-Services (Focused Logic)

```typescript
// ✅ services/ride-create.service.ts - 40 lines
export async function createRide(userId: number, role: string, data: CreateRideInput) {
  if (role !== "CLIENT") {
    throw new ForbiddenError("Only clients can request rides");
  }

  const distance = calculateDistance(...);
  const systemFare = calculateFare(distance);
  const estimatedDuration = calculateEstimatedDuration(distance);

  const ride = await rideRepository.create({...});

  emitSocketEvent("drivers", "ride:created", {...});

  return { ride: formatRideDetails(ride) };
}
```

**المزايا:**
- ✅ كل ملف مسؤول عن feature واحد
- ✅ سهل القراءة والفهم
- ✅ سهل الاختبار
- ✅ No merge conflicts

#### 3️⃣ Utils (Pure Functions)

```typescript
// ✅ utils/ride-calculations.ts - 30 lines
export function calculateDistance(lat1, lng1, lat2, lng2) {
  // Haversine formula
  return distance;
}

export function calculateFare(distance: number) {
  const baseFare = 5;
  const perKm = 2;
  return baseFare + distance * perKm;
}

export function calculateEstimatedDuration(distance: number) {
  const avgSpeed = 40;
  return Math.ceil((distance / avgSpeed) * 60);
}
```

**المزايا:**
- ✅ Pure functions (easy to test)
- ✅ Reusable في أي مكان
- ✅ No side effects
- ✅ Type-safe

## 📊 المقارنة

| الجانب | القديم ❌ | الجديد ✅ |
|--------|----------|----------|
| **حجم الملف الرئيسي** | 450 lines | 20 lines |
| **عدد الملفات** | 1 ملف كبير | 7 ملفات صغيرة |
| **سهولة القراءة** | صعب | سهل جداً |
| **سهولة الاختبار** | صعب | سهل |
| **Merge Conflicts** | كثيرة | نادرة |
| **إضافة feature** | تعديل ملف كبير | ملف جديد صغير |

## 🔄 Data Flow

```
HTTP Request
    ↓
Controller (validates & authenticates)
    ↓
Main Service (delegates)
    ↓
Sub-Service (business logic)
    ↓
Repository (database)
    ↓
Database
```

## 🧪 Testing Strategy

### Unit Tests (Sub-Services)
```typescript
// ride-create.service.test.ts
describe("createRide", () => {
  it("should create a ride for client", async () => {
    const result = await createRide(1, "CLIENT", mockData);
    expect(result.ride).toBeDefined();
  });

  it("should throw error for non-client", async () => {
    await expect(createRide(1, "DRIVER", mockData))
      .rejects.toThrow(ForbiddenError);
  });
});
```

### Unit Tests (Utils)
```typescript
// ride-calculations.test.ts
describe("calculateDistance", () => {
  it("should calculate correct distance", () => {
    const distance = calculateDistance(24.7136, 46.6753, 24.7736, 46.7353);
    expect(distance).toBeCloseTo(8.5, 1);
  });
});
```

## 💡 Best Practices

### ✅ Do
- اجعل كل sub-service أقل من 150 line
- استخدم pure functions في utils
- اجعل الـ main service facade فقط
- اختبر كل ملف بشكل مستقل

### ❌ Don't
- لا تضع business logic في الـ main service
- لا تخلط بين الـ sub-services
- لا تضع database queries في الـ sub-services
- لا تجعل الملفات كبيرة

## 🚀 إضافة Feature جديد

### مثال: إضافة "Rate Ride"

1. أنشئ sub-service جديد:
```typescript
// services/ride-rating.service.ts
export async function rateRide(
  rideId: number,
  userId: number,
  rating: number,
  comment?: string
) {
  // Business logic here
}
```

2. أضفه للـ main service:
```typescript
// ride.service.ts
import * as ratingService from "./services/ride-rating.service";

export class RideService {
  // ... existing methods
  rateRide = ratingService.rateRide;
}
```

3. أضف endpoint في الـ controller:
```typescript
// ride.controller.ts
async rateRide(req: NextRequest, rideId: string) {
  const payload = await authenticate(req);
  const data = rateRideSchema.parse(await req.json());
  const result = await rideService.rateRide(Number(rideId), payload.userId, data.rating, data.comment);
  return Response.json(successResponse(result));
}
```

**هيك بسيطة! 🎉**

## 📚 Resources

- [Main Architecture README](../../README.md)
- [Migration Guide](../../../../MIGRATION_GUIDE.md)
