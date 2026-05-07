# Rides Module

هذا الـ module مسؤول عن إدارة الرحلات (Rides) بكل تفاصيلها.

## الهيكل

```
rides/
├── rides.service.ts           # Main ride operations
├── rides.repository.ts        # Database operations
├── rides.schema.ts            # Zod validation schemas
├── rides.utils.ts             # Utility functions
├── status/                    # Ride status management sub-module
│   ├── status.service.ts
│   ├── status.repository.ts
│   ├── status.schema.ts
│   └── index.ts
├── negotiation/               # Fare negotiation sub-module
│   ├── negotiation.service.ts
│   ├── negotiation.repository.ts
│   ├── negotiation.schema.ts
│   └── index.ts
├── carpooling/                # Carpooling sub-module
│   ├── carpooling.service.ts
│   ├── carpooling.repository.ts
│   ├── carpooling.schema.ts
│   └── index.ts
├── payment/                   # Payment sub-module
│   ├── payment.service.ts
│   ├── payment.repository.ts
│   ├── payment.schema.ts
│   └── index.ts
├── history/                   # Ride history & reports sub-module
│   ├── history.service.ts
│   ├── history.repository.ts
│   ├── history.schema.ts
│   └── index.ts
├── index.ts                   # Module exports
└── README.md                  # Documentation
```

## Sub-Modules

### 1. Main Rides
إدارة الرحلات الأساسية (إنشاء، جلب، تفاصيل).

**Services:**
- `createRideService()` - إنشاء رحلة جديدة (clients only)
- `getUserRidesService()` - جلب رحلات المستخدم مع pagination
- `getNearbyRidesService()` - جلب الرحلات القريبة للسائقين
- `getRideDetailsService()` - جلب تفاصيل رحلة معينة

**API Routes:**
- `POST /api/rides` - إنشاء رحلة
- `GET /api/rides` - جلب رحلات المستخدم
- `GET /api/rides/nearby` - جلب الرحلات القريبة (drivers)
- `GET /api/rides/[id]` - جلب تفاصيل رحلة

### 2. Status Management
إدارة حالات الرحلة (قبول، بدء، إنهاء، إلغاء).

**Services:**
- `updateRideStatusService()` - تحديث حالة الرحلة
- `acceptRideService()` - قبول رحلة (drivers only)
- `cancelRideService()` - إلغاء رحلة

**API Routes:**
- `PATCH /api/rides/[id]/status` - تحديث حالة
- `POST /api/rides/[id]/accept` - قبول رحلة
- `POST /api/rides/[id]/cancel` - إلغاء رحلة

**State Machine:**
```
REQUESTED → ACCEPTED → IN_PROGRESS → COMPLETED
    ↓           ↓            ↓
CANCELLED   CANCELLED    CANCELLED
```

### 3. Negotiation
إدارة التفاوض على السعر بين العميل والسائق.

**Services:**
- `negotiateRideService()` - بدء أو متابعة التفاوض
- `respondToNegotiationService()` - قبول أو رفض عرض

**API Routes:**
- `POST /api/rides/[id]/negotiate` - إرسال عرض
- `POST /api/rides/[id]/negotiate/respond` - الرد على عرض

**Features:**
- ✅ Client يبدأ التفاوض
- ✅ Driver يرد بعرض مضاد
- ✅ Counter-offers متعددة
- ✅ Expiry time (10 دقائق)
- ✅ History tracking

### 4. Carpooling
إدارة الرحلات المشتركة (join, leave, passengers).

**Services:**
- `joinCarpoolingService()` - الانضمام لرحلة مشتركة
- `leaveCarpoolingService()` - مغادرة رحلة مشتركة
- `getRidePassengersService()` - جلب ركاب الرحلة
- `getAvailableCarpoolingService()` - البحث عن رحلات مشتركة متاحة

**API Routes:**
- `POST /api/rides/[id]/join` - الانضمام لرحلة
- `DELETE /api/rides/[id]/leave` - مغادرة رحلة
- `GET /api/rides/[id]/passengers` - جلب الركاب
- `GET /api/rides/carpooling/available` - البحث عن رحلات متاحة

**Features:**
- ✅ Join/leave carpooling rides
- ✅ Seat management (atomic operations)
- ✅ Proximity-based search
- ✅ Passenger fare calculation
- ✅ Real-time notifications

### 5. Payment
إدارة المدفوعات للرحلات.

**Services:**
- `createPaymentService()` - إنشاء دفعة لرحلة
- `getRidePaymentService()` - جلب دفعة رحلة
- `updatePaymentService()` - تحديث حالة الدفعة
- `getMyPaymentsService()` - جلب دفعاتي
- `getAllPaymentsService()` - جلب كل الدفعات (admin)

**API Routes:**
- `POST /api/rides/[id]/payment` - إنشاء دفعة
- `GET /api/rides/[id]/payment` - جلب دفعة
- `PATCH /api/rides/[id]/payment` - تحديث دفعة

**Features:**
- ✅ Multiple payment methods (CASH, CARD, WALLET)
- ✅ Payment status tracking
- ✅ Transaction ID support
- ✅ Access control (client/driver only)

### 6. History & Reports
إدارة سجل الرحلات والتقارير.

**Services:**
- `getRideHistoryService()` - جلب سجل الرحلات مع filters
- `exportRideHistoryService()` - تصدير CSV
- `getAdminRidesReportService()` - تقرير admin شامل

**API Routes:**
- `GET /api/rides/history` - سجل الرحلات
- `GET /api/rides/history/export` - تصدير CSV
- `GET /api/admin/reports/rides` - تقرير admin

## Usage Example

```typescript
// Main Rides
import { createRideService, getRideDetailsService } from "@/server/modules/rides";

// Status Management
import { acceptRideService, cancelRideService } from "@/server/modules/rides/status";

// Negotiation
import { negotiateRideService } from "@/server/modules/rides/negotiation";

// History
import { getRideHistoryService } from "@/server/modules/rides/history";

// Or import all at once
import {
  createRideService,
  acceptRideService,
  negotiateRideService,
  getRideHistoryService,
} from "@/server/modules/rides";
```

## Features

✅ **Modular Structure** - كل feature في sub-module منفصل  
✅ **Repository Pattern** - فصل database operations عن business logic  
✅ **Type Safety** - Zod schemas لكل operations  
✅ **State Machine** - Status transitions محكمة  
✅ **Real-time Updates** - Socket events لكل تغيير  
✅ **Fare Calculation** - حساب تلقائي للسعر والمسافة  
✅ **Negotiation System** - نظام تفاوض كامل  
✅ **Access Control** - Role-based permissions  
✅ **Atomic Operations** - Race condition protection  
✅ **Reports & Export** - CSV export و analytics

## Design Principles

1. **Single Responsibility** - كل sub-module مسؤول عن feature واحد
2. **Separation of Concerns** - Service → Repository → Database
3. **Reusability** - Repository functions قابلة لإعادة الاستخدام
4. **Maintainability** - كود منظم وسهل الصيانة
5. **Scalability** - سهل إضافة sub-modules جديدة
6. **Real-time First** - Socket events لكل تغيير مهم
