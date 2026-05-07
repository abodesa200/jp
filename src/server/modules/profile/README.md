# Profile Module

هذا الـ module مسؤول عن إدارة بروفايلات المستخدمين وكل ما يتعلق بها.

## الهيكل

```
profile/
├── profile.service.ts          # Main profile (client & driver)
├── profile.repository.ts       # Profile database operations
├── profile.schema.ts           # Profile validation schemas
├── favorites/                  # Favorite locations sub-module
│   ├── favorites.service.ts
│   ├── favorites.repository.ts
│   ├── favorites.schema.ts
│   └── index.ts
├── settings/                   # User settings sub-module
│   ├── settings.service.ts
│   ├── settings.repository.ts
│   ├── settings.schema.ts
│   └── index.ts
├── reviews/                    # Reviews sub-module
│   ├── reviews.service.ts
│   ├── reviews.repository.ts
│   ├── reviews.schema.ts
│   └── index.ts
├── index.ts                    # Module exports
└── README.md                   # Documentation
```

## Sub-Modules

### 1. Main Profile
إدارة البروفايل الأساسي للـ client و driver.

**Services:**
- `getClientProfileService()` - جلب بيانات client
- `updateClientProfileService()` - تحديث بيانات client
- `getDriverProfileService()` - جلب بيانات driver
- `updateDriverProfileService()` - تحديث بيانات driver

**API Routes:**
- `GET /api/profile` - جلب بيانات client
- `PATCH /api/profile` - تحديث بيانات client
- `GET /api/profile/driver` - جلب بيانات driver
- `PATCH /api/profile/driver` - تحديث بيانات driver

### 2. Favorites
إدارة المواقع المفضلة للمستخدم (حد أقصى 20 موقع).

**Services:**
- `getFavoritesService()` - جلب جميع المواقع المفضلة
- `addFavoriteService()` - إضافة موقع مفضل جديد
- `deleteFavoriteService()` - حذف موقع مفضل

**API Routes:**
- `GET /api/profile/favorites` - جلب المواقع المفضلة
- `POST /api/profile/favorites` - إضافة موقع مفضل
- `DELETE /api/profile/favorites/[id]` - حذف موقع مفضل

### 3. Settings
إدارة إعدادات المستخدم (اللغة، الإشعارات).

**Services:**
- `getSettingsService()` - جلب الإعدادات (مع إنشاء default إذا لم تكن موجودة)
- `updateSettingsService()` - تحديث الإعدادات

**API Routes:**
- `GET /api/profile/settings` - جلب الإعدادات
- `PATCH /api/profile/settings` - تحديث الإعدادات

### 4. Reviews
إدارة التقييمات (للرحلات والسائقين).

**Services:**
- `createReviewService()` - إنشاء تقييم لرحلة
- `getRideReviewService()` - جلب تقييم رحلة معينة
- `getDriverReviewsService()` - جلب تقييمات سائق
- `getMyReviewsService()` - جلب تقييماتي (كـ client أو driver)

**API Routes:**
- `GET /api/profile/reviews` - جلب تقييماتي
- `POST /api/rides/[id]/review` - إنشاء تقييم لرحلة
- `GET /api/rides/[id]/review` - جلب تقييم رحلة

## Usage Example

```typescript
// Main Profile
import { getClientProfileService } from "@/server/modules/profile";

// Favorites
import { getFavoritesService } from "@/server/modules/profile/favorites";

// Settings
import { getSettingsService } from "@/server/modules/profile/settings";

// Reviews
import { getMyReviewsService } from "@/server/modules/profile/reviews";

// Or import all at once
import {
  getClientProfileService,
  getFavoritesService,
  getSettingsService,
  getMyReviewsService,
} from "@/server/modules/profile";
```

## Features

✅ **Modular Structure** - كل feature في sub-module منفصل  
✅ **Repository Pattern** - فصل database operations عن business logic  
✅ **Type Safety** - Zod schemas لكل operations  
✅ **Error Handling** - Custom errors واضحة  
✅ **Validation** - Email/phone uniqueness checks  
✅ **Auto Updates** - Location timestamp updates  
✅ **Limits** - Max 20 favorite locations  
✅ **Upsert** - Auto-create default settings  
✅ **Transactions** - Review creation مع driver rating update

## Design Principles

1. **Single Responsibility** - كل sub-module مسؤول عن feature واحد
2. **Separation of Concerns** - Service → Repository → Database
3. **Reusability** - Repository functions قابلة لإعادة الاستخدام
4. **Maintainability** - كود منظم وسهل الصيانة
5. **Scalability** - سهل إضافة sub-modules جديدة
