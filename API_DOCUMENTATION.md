# API Documentation - Junior Project

## Base URL
```
http://localhost:3000/api
```

## Authentication
معظم الـ APIs تحتاج JWT Token يتم إرساله عبر:
- **Cookie**: `token=<jwt_token>` (يتم set تلقائياً عند login)
- **Header**: `Authorization: Bearer <jwt_token>`

---

## Flow الصحيح للاستخدام

### 1. Client/User Flow
```
Send OTP → Verify OTP (احصل على token) → استخدم باقي الـ APIs
```

### 2. Driver Flow
```
Send OTP → Verify OTP → Update Profile (driver) → Update Status (online) → Update Location → Accept Rides
```

### 3. Admin Flow
```
Admin Login → إدارة كل شيء
```

---

## 🔐 Auth APIs

### POST `/api/auth/send-otp`
إرسال OTP للمستخدم عبر الإيميل أو الجوال.

**Body:**
```json
{ "email": "user@example.com" }
```

**Response:**
```json
{ "message": "OTP sent successfully" }
```

---

### POST `/api/auth/verify-otp`
التحقق من OTP وإنشاء حساب إذا كان جديد، ثم إرجاع JWT token.

**Body:**
```json
{ "email": "user@example.com", "otp": "123456" }
```

**Response:** يرجع `token` ويضعه في HttpOnly Cookie تلقائياً.
```json
{ "token": "jwt_token", "user": { "id": 1, "email": "...", "role": "CLIENT" } }
```

---

### POST `/api/auth/admin-login`
تسجيل دخول الأدمن بالإيميل وكلمة المرور.

**Body:**
```json
{ "email": "super@admin.com", "password": "password" }
```

**Response:**
```json
{ "token": "jwt_token", "user": { "id": 1, "role": "ADMIN" } }
```

---

## 👤 Profile APIs
> يحتاج: `AUTH TOKEN`

### GET `/api/profile`
جلب بيانات الـ Client الحالي.

### PATCH `/api/profile`
تحديث بيانات الـ Client.

**Body:**
```json
{ "name": "اسم المستخدم", "phone": "+963xxxxxxxxx" }
```

---

### GET `/api/profile/driver`
جلب بيانات الـ Driver الحالي.

### PATCH `/api/profile/driver`
تحديث بيانات الـ Driver (اسم، سيارة، رخصة، إلخ).

---

## 🚗 Driver APIs

### GET `/api/drivers/:id`
جلب بيانات سائق معين (عام، لا يحتاج auth).

### GET `/api/drivers/:id/reviews`
جلب تقييمات سائق معين.

**Query Params:** `page`, `limit`

### GET `/api/drivers/:id/stats`
جلب إحصائيات سائق (عدد الرحلات، التقييم، إلخ).

---

### PUT `/api/drivers/status`
> يحتاج: `DRIVER TOKEN`

تحديث حالة السائق (أونلاين/أوفلاين).

**Body:**
```json
{ "isOnline": true }
```

---

### PUT `/api/drivers/location`
> يحتاج: `DRIVER TOKEN`

تحديث موقع السائق الحالي (يُستدعى بشكل دوري).

**Body:**
```json
{ "latitude": 33.5138, "longitude": 36.2765 }
```

---

### GET `/api/drivers/nearby`
جلب السائقين القريبين (عام).

**Query Params:** `latitude`, `longitude`, `radiusKm` (default: 5)

---

## 🛣️ Rides APIs
> يحتاج: `AUTH TOKEN`

### POST `/api/rides`
إنشاء رحلة جديدة (من قِبل العميل).

**Body:**
```json
{
  "pickupLat": 33.5138,
  "pickupLng": 36.2765,
  "dropoffLat": 33.5200,
  "dropoffLng": 36.2900,
  "type": "PRIVATE",
  "price": 5000
}
```
> `type`: `PRIVATE` أو `CARPOOLING`

---

### GET `/api/rides`
جلب رحلات المستخدم الحالي.

**Query Params:** `status`, `page`, `limit`

---

### GET `/api/rides/:id`
جلب تفاصيل رحلة معينة.

### PATCH `/api/rides/:id`
تحديث حالة الرحلة (مثلاً: `STARTED`, `COMPLETED`).

**Body:**
```json
{ "status": "COMPLETED" }
```

---

### POST `/api/rides/:id/accept`
> يحتاج: `DRIVER TOKEN`

السائق يقبل الرحلة.

---

### POST `/api/rides/:id/cancel`
إلغاء الرحلة (عميل أو سائق).

**Body:**
```json
{ "reason": "سبب الإلغاء" }
```

---

### GET `/api/rides/nearby`
> يحتاج: `DRIVER TOKEN`

جلب الرحلات القريبة من موقع السائق.

**Query Params:** `maxDistance`, `limit`

---

### GET `/api/rides/history`
جلب سجل الرحلات السابقة.

**Query Params:** `status`, `type`, `startDate`, `endDate`, `page`, `limit`

---

## 🚌 Carpooling APIs
> يحتاج: `AUTH TOKEN`

### GET `/api/rides/carpooling/available`
جلب رحلات الكاربولينج المتاحة بالقرب من موقع معين.

**Query Params:** `pickupLat`, `pickupLng`, `dropoffLat`, `dropoffLng`, `radius`, `limit`

---

### POST `/api/rides/:id/join`
الانضمام لرحلة كاربولينج.

**Body:**
```json
{ "seats": 1 }
```

---

### DELETE `/api/rides/:id/leave`
مغادرة رحلة كاربولينج.

---

### GET `/api/rides/:id/passengers`
جلب قائمة الركاب في رحلة كاربولينج.

---

## 💰 Negotiation APIs
> يحتاج: `AUTH TOKEN`

### POST `/api/rides/:id/negotiate`
بدء تفاوض على سعر الرحلة أو إرسال عرض مضاد.

**Body:**
```json
{ "offeredPrice": 4500 }
```

---

### PATCH `/api/rides/:id/negotiate`
قبول أو رفض عرض التفاوض.

**Body:**
```json
{ "action": "accept" }
```
> `action`: `accept` أو `reject`

---

## 💳 Payment APIs
> يحتاج: `AUTH TOKEN`

### POST `/api/rides/:id/payment`
إنشاء دفعة لرحلة.

**Body:**
```json
{ "method": "CASH", "amount": 5000 }
```
> `method`: `CASH` أو `CARD`

---

### GET `/api/rides/:id/payment`
جلب تفاصيل دفعة رحلة معينة.

### PATCH `/api/rides/:id/payment`
تحديث حالة الدفعة.

---

### GET `/api/payments`
جلب كل مدفوعاتي.

**Query Params:** `status`, `page`, `limit`

---

### POST `/api/rides/:id/apply-promo`
تطبيق كود خصم على رحلة.

**Body:**
```json
{ "code": "PROMO2025" }
```

---

## ⭐ Reviews APIs
> يحتاج: `AUTH TOKEN`

### POST `/api/rides/:id/review`
إضافة تقييم للرحلة بعد اكتمالها.

**Body:**
```json
{ "rating": 5, "comment": "سائق ممتاز" }
```

### GET `/api/rides/:id/review`
جلب تقييم رحلة معينة.

---

## ❤️ Favorites APIs
> يحتاج: `AUTH TOKEN`

### GET `/api/favorites`
جلب المواقع المفضلة.

### POST `/api/favorites`
إضافة موقع مفضل.

**Body:**
```json
{ "name": "البيت", "latitude": 33.5138, "longitude": 36.2765 }
```

### DELETE `/api/favorites/:id`
حذف موقع مفضل.

---

## 🔔 Notifications APIs
> يحتاج: `AUTH TOKEN`

### GET `/api/notifications`
جلب كل الإشعارات.

**Query Params:** `limit`, `offset`, `unreadOnly`

### PATCH `/api/notifications`
تعليم كل الإشعارات كمقروءة.

### DELETE `/api/notifications`
حذف كل الإشعارات.

---

### PATCH `/api/notifications/:id`
تعليم إشعار معين كمقروء.

### DELETE `/api/notifications/:id`
حذف إشعار معين.

### PATCH `/api/notifications/:id/read`
تعليم إشعار كمقروء (endpoint بديل).

### GET `/api/notifications/unread-count`
جلب عدد الإشعارات غير المقروءة.

---

## 🎫 Support APIs
> يحتاج: `AUTH TOKEN`

### POST `/api/support/tickets`
إنشاء تذكرة دعم فني.

**Body:**
```json
{ "subject": "مشكلة في الدفع", "message": "تفاصيل المشكلة..." }
```

### GET `/api/support/tickets`
جلب تذاكر الدعم الخاصة بي.

**Query Params:** `status` (`open`, `closed`, `all`), `page`, `limit`

### GET `/api/support/tickets/:id`
جلب تفاصيل تذكرة معينة.

---

## 🛡️ Admin APIs
> يحتاج: `ADMIN TOKEN`

### GET `/api/admin/stats`
إحصائيات الداشبورد الرئيسية.

### GET `/api/admin/stats/users`
إحصائيات المستخدمين.

### GET `/api/admin/stats/drivers`
إحصائيات السائقين.

### GET `/api/admin/stats/rides`
إحصائيات الرحلات.

### GET `/api/admin/stats/revenue`
إحصائيات الإيرادات.

---

### GET `/api/admin/users`
جلب قائمة المستخدمين.

**Query Params:** `role`, `page`, `limit`, `search`

### POST `/api/admin/users`
إنشاء مستخدم جديد.

### GET `/api/admin/users/:id`
جلب مستخدم بالـ ID.

### PATCH `/api/admin/users/:id`
تعديل بيانات مستخدم.

### DELETE `/api/admin/users/:id`
حذف مستخدم.

---

### GET `/api/admin/drivers`
جلب قائمة السائقين.

**Query Params:** `isApproved`, `isOnline`, `page`, `limit`, `search`

### GET `/api/admin/drivers/pending`
جلب السائقين المنتظرين الموافقة.

### GET `/api/admin/drivers/:id`
جلب سائق بالـ ID.

### PATCH `/api/admin/drivers/:id`
تعديل/موافقة/رفض سائق.

**Body:**
```json
{ "isApproved": true }
```

### DELETE `/api/admin/drivers/:id`
حذف سائق.

---

### GET `/api/admin/rides`
جلب كل الرحلات.

**Query Params:** `status`, `type`, `page`, `limit`, `search`, `startDate`, `endDate`

### POST `/api/admin/rides/create`
إنشاء رحلة يدوياً من قِبل الأدمن.

### GET `/api/admin/rides/:id`
جلب رحلة بالـ ID.

### PATCH `/api/admin/rides/:id`
تعديل رحلة.

### DELETE `/api/admin/rides/:id`
حذف رحلة.

### POST `/api/admin/rides/:id/assign`
تعيين سائق لرحلة يدوياً.

**Body:**
```json
{ "driverId": 5 }
```

---

### GET `/api/admin/payments`
جلب كل المدفوعات.

**Query Params:** `status`, `method`, `page`, `limit`, `startDate`, `endDate`

### GET `/api/admin/payments/stats`
إحصائيات المدفوعات.

### GET `/api/admin/payments/:id`
جلب دفعة بالـ ID.

### PATCH `/api/admin/payments/:id`
تعديل حالة دفعة.

---

### GET `/api/admin/promo-codes`
جلب كل أكواد الخصم.

**Query Params:** `isActive`, `page`, `limit`, `search`

### POST `/api/admin/promo-codes`
إنشاء كود خصم جديد.

**Body:**
```json
{
  "code": "SUMMER25",
  "discountPercent": 25,
  "maxUses": 100,
  "expiresAt": "2025-12-31"
}
```

### GET `/api/admin/promo-codes/:id`
جلب كود خصم بالـ ID.

### PATCH `/api/admin/promo-codes/:id`
تعديل كود خصم.

### DELETE `/api/admin/promo-codes/:id`
حذف كود خصم.

---

### GET `/api/admin/support/tickets`
جلب كل تذاكر الدعم.

**Query Params:** `status`, `page`, `limit`

### GET `/api/admin/support/stats`
إحصائيات تذاكر الدعم.

### PATCH `/api/admin/support/tickets/:id`
تحديث حالة تذكرة دعم (مثلاً: إغلاقها).

### DELETE `/api/admin/support/tickets/:id`
حذف تذكرة دعم.

---

### POST `/api/admin/notifications/send`
إرسال إشعار لمستخدم أو مجموعة مستخدمين.

**Body (مستخدم واحد):**
```json
{ "userId": 1, "title": "عنوان", "message": "نص الإشعار" }
```

**Body (مجموعة):**
```json
{ "userIds": [1, 2, 3], "title": "عنوان", "message": "نص الإشعار" }
```

---

## ملاحظات مهمة

1. **Ride Status Flow:**
   ```
   PENDING → ACCEPTED → STARTED → COMPLETED
                ↓
            CANCELLED
   ```

2. **Driver Approval Flow:**
   ```
   يسجل السائق → isApproved: false → الأدمن يوافق → isApproved: true → يقدر يشتغل
   ```

3. **Negotiation Flow:**
   ```
   العميل ينشئ رحلة → السائق يفاوض (POST negotiate) → العميل يقبل/يرفض (PATCH negotiate)
   ```

4. **Carpooling Flow:**
   ```
   سائق ينشئ رحلة CARPOOLING → عملاء يبحثون (carpooling/available) → ينضمون (join) → يغادرون (leave)
   ```
