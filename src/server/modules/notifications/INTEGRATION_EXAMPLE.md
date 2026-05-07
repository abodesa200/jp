# Integration Example: Notifications with Rides Module

هذا مثال على كيفية دمج الـ notifications مع الـ rides module.

## Example 1: Send Notification When Ride is Accepted

```typescript
// في ملف: src/server/modules/rides/ride.service.ts

import { rideNotifications } from '@/server/modules/notifications';

export async function acceptRideService(
    payload: JWTPayload,
    rideId: number
) {
    // ... existing logic to accept ride
    
    const ride = await rideRepository.acceptRide(rideId, payload.userId);
    
    // إرسال إشعار للزبون
    const driver = await driverRepository.findById(payload.userId);
    await rideNotifications.rideAccepted(
        ride.clientId,
        driver.user.name || "السائق"
    );
    
    return ride;
}
```

## Example 2: Send Notification When Driver Arrives

```typescript
// في ملف: src/server/modules/rides/ride.service.ts

import { rideNotifications } from '@/server/modules/notifications';

export async function updateRideStatusService(
    payload: JWTPayload,
    rideId: number,
    status: RideStatus
) {
    const ride = await rideRepository.updateStatus(rideId, status);
    
    // إرسال إشعار حسب الحالة
    if (status === 'DRIVER_ARRIVED') {
        const driver = await driverRepository.findById(payload.userId);
        await rideNotifications.driverArrived(
            ride.clientId,
            driver.user.name || "السائق"
        );
    }
    
    if (status === 'IN_PROGRESS') {
        await rideNotifications.rideStarted(ride.clientId);
    }
    
    if (status === 'COMPLETED') {
        await rideNotifications.rideCompleted(
            ride.clientId,
            ride.fare || 0
        );
    }
    
    return ride;
}
```

## Example 3: Broadcast New Ride to Nearby Drivers

```typescript
// في ملف: src/server/modules/rides/ride.service.ts

import { rideNotifications } from '@/server/modules/notifications';

export async function createRideService(
    payload: JWTPayload,
    data: CreateRideDTO
) {
    // إنشاء الرحلة
    const ride = await rideRepository.create({
        clientId: payload.userId,
        ...data,
    });
    
    // البحث عن السائقين القريبين
    const nearbyDrivers = await driverRepository.findNearby(
        data.pickupLat,
        data.pickupLng,
        5 // 5 km radius
    );
    
    // إرسال إشعار لجميع السائقين القريبين
    const driverUserIds = nearbyDrivers.map(d => d.userId);
    await rideNotifications.broadcastRideRequest(
        driverUserIds,
        data.pickupAddress || "موقع قريب منك"
    );
    
    return ride;
}
```

## Example 4: Send Payment Notification

```typescript
// في ملف: src/server/modules/payments/payment.service.ts

import { paymentNotifications } from '@/server/modules/notifications';

export async function processPaymentService(
    payload: JWTPayload,
    rideId: number,
    paymentData: PaymentDTO
) {
    try {
        // معالجة الدفع
        const payment = await paymentRepository.create({
            rideId,
            ...paymentData,
        });
        
        // إرسال إشعار بنجاح الدفع
        await paymentNotifications.paymentSuccess(
            payload.userId,
            payment.amount
        );
        
        return payment;
    } catch (error) {
        // إرسال إشعار بفشل الدفع
        await paymentNotifications.paymentFailed(
            payload.userId,
            "حدث خطأ أثناء معالجة الدفع"
        );
        
        throw error;
    }
}
```

## Example 5: Send Driver Approval Notification

```typescript
// في ملف: src/server/modules/drivers/driver.service.ts

import { driverNotifications } from '@/server/modules/notifications';

export async function approveDriverService(
    payload: JWTPayload,
    driverId: number
) {
    // قبول السائق
    const driver = await driverRepository.approve(driverId);
    
    // إرسال إشعار للسائق
    await driverNotifications.driverApproved(driver.userId);
    
    return driver;
}

export async function rejectDriverService(
    payload: JWTPayload,
    driverId: number,
    reason?: string
) {
    // رفض السائق
    const driver = await driverRepository.reject(driverId);
    
    // إرسال إشعار للسائق
    await driverNotifications.driverRejected(driver.userId, reason);
    
    return driver;
}
```

## Example 6: Send Review Notification

```typescript
// في ملف: src/server/modules/reviews/review.service.ts

import { driverNotifications } from '@/server/modules/notifications';

export async function createReviewService(
    payload: JWTPayload,
    data: CreateReviewDTO
) {
    // إنشاء التقييم
    const review = await reviewRepository.create({
        clientId: payload.userId,
        ...data,
    });
    
    // إرسال إشعار للسائق
    await driverNotifications.newReview(
        data.driverId,
        data.rating,
        data.comment
    );
    
    return review;
}
```

## Example 7: Send Promo Code Notification

```typescript
// في ملف: src/server/modules/promo/promo.service.ts

import { promoNotifications } from '@/server/modules/notifications';

export async function createPromoCodeService(
    payload: JWTPayload,
    data: CreatePromoCodeDTO
) {
    // إنشاء كود الخصم
    const promoCode = await promoRepository.create(data);
    
    // إرسال إشعار لجميع المستخدمين
    const allUsers = await userRepository.findAll();
    const userIds = allUsers.map(u => u.id);
    
    const discountText = promoCode.discountType === 'PERCENTAGE'
        ? `${promoCode.discountValue}%`
        : `${promoCode.discountValue} ريال`;
    
    await promoNotifications.specialOffer(
        userIds,
        "كود خصم جديد",
        `استخدم الكود ${promoCode.code} واحصل على خصم ${discountText}`
    );
    
    return promoCode;
}
```

## Example 8: Custom Notification

إذا كنت تحتاج إشعار مخصص غير موجود في الـ helpers:

```typescript
import { sendNotificationToUser } from '@/server/modules/notifications';

// في أي service
await sendNotificationToUser(
    userId,
    "عنوان مخصص",
    "رسالة مخصصة حسب احتياجك"
);
```

## Best Practices

1. **استخدم الـ helpers عندما يكون متاح**
   ```typescript
   // ✅ Good
   await rideNotifications.rideAccepted(clientId, driverName);
   
   // ❌ Avoid
   await sendNotificationToUser(clientId, "تم قبول الرحلة", `السائق ${driverName}...`);
   ```

2. **لا تنتظر الإشعارات (Fire and Forget)**
   ```typescript
   // ✅ Good - لا تنتظر
   rideNotifications.rideAccepted(clientId, driverName).catch(console.error);
   
   // ❌ Avoid - لا تجعل الإشعار يوقف العملية
   await rideNotifications.rideAccepted(clientId, driverName);
   ```

3. **Handle Errors Gracefully**
   ```typescript
   try {
       await rideNotifications.rideAccepted(clientId, driverName);
   } catch (error) {
       // Log the error but don't fail the main operation
       console.error('Failed to send notification:', error);
   }
   ```

4. **استخدم Bulk Operations عند الإمكان**
   ```typescript
   // ✅ Good - إرسال واحد لعدة مستخدمين
   await sendNotificationToUsers(userIds, title, message);
   
   // ❌ Avoid - إرسال متعدد
   for (const userId of userIds) {
       await sendNotificationToUser(userId, title, message);
   }
   ```

## Testing

```typescript
// في ملف الاختبار
import { rideNotifications } from '@/server/modules/notifications';

describe('Ride Service', () => {
    it('should send notification when ride is accepted', async () => {
        const spy = jest.spyOn(rideNotifications, 'rideAccepted');
        
        await acceptRideService(payload, rideId);
        
        expect(spy).toHaveBeenCalledWith(clientId, driverName);
    });
});
```
