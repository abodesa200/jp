# Driver Module

هذا الـ module مسؤول عن كل العمليات المتعلقة بالسائقين (Drivers).

## Structure

```
drivers/
├── driver.schema.ts      # Zod validation schemas
├── driver.repository.ts  # Database operations
├── driver.service.ts     # Business logic
├── index.ts             # Module exports
└── README.md            # Documentation
```

## Features

### 1. Driver Profile
- `getDriverProfileService` - جلب معلومات سائق معين (public)
- `getMyDriverProfileService` - جلب معلومات السائق الحالي (authenticated)

### 2. Location Management
- `updateDriverLocationService` - تحديث موقع السائق
- `getNearbyDriversService` - البحث عن السائقين القريبين

### 3. Status Management
- `updateDriverStatusService` - تحديث حالة السائق (online/offline)

### 4. Statistics
- `getDriverStatsService` - جلب إحصائيات سائق معين
- `getMyDriverStatsService` - جلب إحصائيات السائق الحالي

### 5. Reviews
- `getDriverReviewsService` - جلب تقييمات سائق معين
- `getMyDriverReviewsService` - جلب تقييمات السائق الحالي

### 6. Rides
- `getDriverRidesService` - جلب رحلات السائق

## Usage Example

```typescript
import {
    getDriverProfileService,
    updateDriverLocationService,
    getNearbyDriversService,
} from "@/server/modules/drivers";

// Get driver profile
const driver = await getDriverProfileService({ driverId: 1 });

// Update location
await updateDriverLocationService(
    { userId: 1, role: "DRIVER" },
    { latitude: 33.8938, longitude: 35.5018 }
);

// Find nearby drivers
const nearby = await getNearbyDriversService({
    latitude: 33.8938,
    longitude: 35.5018,
    radiusKm: 5,
});
```

## API Routes

يجب إنشاء الـ routes التالية:

### Public Routes
- `GET /api/drivers/:id` - Get driver profile
- `GET /api/drivers/:id/stats` - Get driver stats
- `GET /api/drivers/:id/reviews` - Get driver reviews
- `GET /api/drivers/nearby` - Get nearby drivers

### Authenticated Routes (Driver only)
- `GET /api/drivers/me` - Get my profile
- `GET /api/drivers/me/stats` - Get my stats
- `GET /api/drivers/me/reviews` - Get my reviews
- `GET /api/drivers/me/rides` - Get my rides
- `PUT /api/drivers/me/location` - Update my location
- `PUT /api/drivers/me/status` - Update my status (online/offline)

## Notes

### Location Tracking
- الـ implementation الحالي يستخدم Haversine formula لحساب المسافة
- للـ production، يُفضل استخدام PostGIS أو خدمة خارجية مثل Google Maps
- يجب تحديث الموقع بشكل دوري (كل 10-30 ثانية)

### Performance
- الـ `findNearbyDrivers` يجلب كل السائقين ثم يفلترهم
- للـ production، استخدم spatial indexes في PostgreSQL

### Security
- كل الـ endpoints المتعلقة بالسائق الحالي تتطلب JWT token
- يجب التحقق من أن الـ role هو "DRIVER"
- السائق يجب أن يكون approved قبل ما يقدر يروح online

## Future Enhancements

1. **Real-time Location Updates**
   - استخدام WebSockets أو Server-Sent Events
   - تحديث الموقع بشكل real-time

2. **Advanced Search**
   - فلترة حسب التقييم
   - فلترة حسب نوع السيارة
   - فلترة حسب السعر

3. **Driver Analytics**
   - تقارير يومية/أسبوعية/شهرية
   - تحليل الأداء
   - مقارنة مع السائقين الآخرين

4. **Notifications**
   - إشعارات عند طلب رحلة جديدة
   - إشعارات عند تقييم جديد
   - إشعارات عند تحديث الحالة
