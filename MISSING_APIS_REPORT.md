# 📋 تقرير شامل - APIs الناقصة في المشروع

تاريخ التقرير: 4 مايو 2026

## 📊 ملخص تنفيذي

بعد فحص شامل للمشروع ومقارنة APIs الموجودة مع المخطط في `openapi.yaml` وقاعدة البيانات `schema.prisma`، تم تحديد **47 API ناقصة** موزعة على 12 فئة.

---

## ✅ APIs الموجودة حالياً (Implemented)

### Authentication (3/3) ✅
- ✅ POST `/api/auth/send-otp` - إرسال OTP
- ✅ POST `/api/auth/verify-otp` - التحقق من OTP
- ✅ POST `/api/auth/admin-login` - تسجيل دخول الأدمن

### Profile (2/4) ⚠️
- ✅ GET `/api/profile` - جلب البروفايل
- ✅ PATCH `/api/profile` - تحديث البروفايل
- ❌ GET `/api/profile/driver` - جلب بروفايل السائق الكامل
- ❌ PATCH `/api/profile/driver` - تحديث بروفايل السائق

### Rides - Basic (5/5) ✅
- ✅ POST `/api/rides` - إنشاء رحلة جديدة
- ✅ GET `/api/rides` - جلب رحلات المستخدم
- ✅ GET `/api/rides/{id}` - تفاصيل رحلة
- ✅ PATCH `/api/rides/{id}` - تحديث حالة الرحلة
- ✅ GET `/api/rides/nearby` - رحلات قريبة للسائق

### Rides - Actions (3/3) ✅
- ✅ POST `/api/rides/{id}/accept` - قبول رحلة
- ✅ POST `/api/rides/{id}/cancel` - إلغاء رحلة
- ✅ POST `/api/rides/{id}/negotiate` - التفاوض على السعر

### Drivers (1/4) ⚠️
- ✅ PUT `/api/drivers/location` - تحديث موقع السائق
- ❌ GET `/api/drivers/online` - قائمة السواقين المتصلين
- ❌ POST `/api/drivers/status` - تحديث حالة السائق
- ❌ GET `/api/drivers/nearby` - سواقين قريبين

### Admin - Users (2/4) ⚠️
- ✅ GET `/api/admin/users` - قائمة المستخدمين
- ✅ POST `/api/admin/users` - إنشاء مستخدم جديد
- ❌ GET `/api/admin/users/{id}` - تفاصيل مستخدم
- ❌ PATCH `/api/admin/users/{id}` - تحديث مستخدم
- ❌ DELETE `/api/admin/users/{id}` - حذف مستخدم

### Admin - Drivers (0/5) ❌
- ❌ GET `/api/admin/drivers` - قائمة السواقين
- ❌ POST `/api/admin/drivers` - إنشاء سائق جديد
- ❌ GET `/api/admin/drivers/{id}` - تفاصيل سائق
- ❌ PATCH `/api/admin/drivers/{id}` - تحديث/موافقة على سائق
- ❌ DELETE `/api/admin/drivers/{id}` - حذف سائق

### Admin - Rides (2/3) ⚠️
- ✅ GET `/api/admin/rides` - قائمة الرحلات
- ✅ POST `/api/admin/rides/create` - إنشاء رحلة (للأدمن)
- ❌ GET `/api/admin/rides/{id}` - تفاصيل رحلة (للأدمن)
- ❌ PATCH `/api/admin/rides/{id}` - تحديث رحلة (للأدمن)

### Admin - Stats (1/5) ⚠️
- ✅ GET `/api/admin/stats` - إحصائيات عامة
- ❌ GET `/api/admin/stats/rides` - إحصائيات الرحلات
- ❌ GET `/api/admin/stats/revenue` - إحصائيات الإيرادات
- ❌ GET `/api/admin/stats/drivers` - إحصائيات السواقين
- ❌ GET `/api/admin/stats/users` - إحصائيات المستخدمين

---

## 🔴 المرحلة 1: APIs حرجة (Critical Priority)

### 1. Admin - Drivers Management (5 APIs)

#### ❌ GET `/api/admin/drivers`
**الوصف:** قائمة السواقين مع فلترة
**Query Parameters:**
- `isApproved` (boolean) - فلترة حسب الموافقة
- `isOnline` (boolean) - فلترة حسب الاتصال
- `page` (number) - رقم الصفحة
- `limit` (number) - عدد النتائج

**Response:**
```json
{
  "drivers": [
    {
      "id": 1,
      "userId": 5,
      "user": {
        "name": "Ahmed",
        "email": "ahmed@example.com"
      },
      "licenseNumber": "123456",
      "carModel": "Toyota Camry",
      "isApproved": true,
      "isOnline": true,
      "rating": 4.5
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

#### ❌ POST `/api/admin/drivers`
**الوصف:** إنشاء سائق جديد من قبل الأدمن
**Request Body:**
```json
{
  "email": "driver@example.com",
  "name": "Mohammed Ahmed",
  "phone": "+966501234567",
  "licenseNumber": "123456789",
  "carModel": "Toyota Camry 2022",
  "carPlate": "ABC-1234",
  "carColor": "White",
  "carYear": 2022,
  "isApproved": false
}
```

#### ❌ GET `/api/admin/drivers/{id}`
**الوصف:** تفاصيل سائق معين
**Response:** كائن Driver كامل مع User

#### ❌ PATCH `/api/admin/drivers/{id}`
**الوصف:** تحديث معلومات السائق والموافقة عليه
**Request Body:**
```json
{
  "licenseNumber": "987654321",
  "carModel": "Honda Accord",
  "isApproved": true
}
```

#### ❌ DELETE `/api/admin/drivers/{id}`
**الوصف:** حذف سائق
**Response:** `{ "success": true }`

---

### 2. Driver Profile (2 APIs)

#### ❌ GET `/api/profile/driver`
**الوصف:** جلب بروفايل السائق الكامل للمستخدم الحالي
**Auth:** Bearer Token (role=DRIVER)
**Response:**
```json
{
  "id": 1,
  "userId": 5,
  "licenseNumber": "123456",
  "carModel": "Toyota Camry",
  "carPlate": "ABC-1234",
  "carColor": "White",
  "carYear": 2022,
  "isApproved": true,
  "isOnline": false,
  "latitude": 24.7136,
  "longitude": 46.6753,
  "lastLocationUpdate": "2026-05-03T14:12:53.000Z",
  "rating": 4.5,
  "totalRides": 150
}
```

#### ❌ PATCH `/api/profile/driver`
**الوصف:** تحديث بروفايل السائق
**Request Body:**
```json
{
  "licenseNumber": "987654",
  "carModel": "Honda Accord",
  "carColor": "Black",
  "isOnline": true,
  "latitude": 24.7136,
  "longitude": 46.6753
}
```

---

### 3. Driver Status & Online System (3 APIs)

#### ❌ GET `/api/drivers/online`
**الوصف:** قائمة السواقين المتصلين حالياً
**Query Parameters:**
- `lat` (number) - موقع البحث
- `lng` (number) - موقع البحث
- `radius` (number) - نطاق البحث بالكيلومتر

**Response:**
```json
{
  "drivers": [
    {
      "id": 1,
      "userId": 5,
      "user": {
        "name": "Ahmed",
        "avatarUrl": "..."
      },
      "latitude": 24.7136,
      "longitude": 46.6753,
      "distance": 2.5,
      "rating": 4.5,
      "carModel": "Toyota Camry"
    }
  ]
}
```

#### ❌ POST `/api/drivers/status`
**الوصف:** تحديث حالة السائق (online/offline)
**Request Body:**
```json
{
  "isOnline": true,
  "latitude": 24.7136,
  "longitude": 46.6753
}
```

#### ❌ GET `/api/drivers/nearby`
**الوصف:** سواقين قريبين من موقع معين
**Query Parameters:**
- `lat` (number)
- `lng` (number)
- `radius` (number) - default: 10km

---

## 🟡 المرحلة 2: APIs مهمة (High Priority)

### 4. Reviews - التقييمات (4 APIs)

#### ❌ POST `/api/rides/{id}/review`
**الوصف:** إضافة تقييم للرحلة
**Request Body:**
```json
{
  "rating": 5,
  "comment": "Excellent driver and clean car"
}
```

#### ❌ GET `/api/rides/{id}/review`
**الوصف:** جلب تقييم رحلة معينة

#### ❌ GET `/api/drivers/{id}/reviews`
**الوصف:** جلب تقييمات سائق معين
**Query Parameters:**
- `page` (number)
- `limit` (number)

#### ❌ GET `/api/profile/reviews`
**الوصف:** تقييماتي (كسائق أو زبون)

---

### 5. Payments - الدفعات (5 APIs)

#### ❌ POST `/api/rides/{id}/payment`
**الوصف:** إنشاء دفعة للرحلة
**Request Body:**
```json
{
  "method": "CASH",
  "amount": 32.50
}
```

#### ❌ GET `/api/rides/{id}/payment`
**الوصف:** جلب معلومات الدفعة

#### ❌ PATCH `/api/rides/{id}/payment`
**الوصف:** تحديث حالة الدفعة
**Request Body:**
```json
{
  "status": "PAID",
  "transactionId": "txn_123456"
}
```

#### ❌ GET `/api/payments`
**الوصف:** قائمة دفعاتي
**Query Parameters:**
- `status` (PENDING | PAID | FAILED | REFUNDED)
- `page`, `limit`

#### ❌ GET `/api/admin/payments`
**الوصف:** قائمة كل الدفعات (للأدمن)

---

### 6. Carpooling - مشاركة الركوب (4 APIs)

#### ❌ POST `/api/rides/{id}/join`
**الوصف:** انضمام راكب لرحلة carpooling
**Request Body:**
```json
{
  "pickupLat": 24.7136,
  "pickupLng": 46.6753,
  "pickupAddress": "King Fahd Road",
  "dropoffLat": 24.7736,
  "dropoffLng": 46.7353,
  "dropoffAddress": "Airport"
}
```

#### ❌ DELETE `/api/rides/{id}/leave`
**الوصف:** مغادرة راكب من رحلة carpooling

#### ❌ GET `/api/rides/{id}/passengers`
**الوصف:** قائمة الركاب في رحلة carpooling

#### ❌ GET `/api/rides/carpooling/available`
**الوصف:** رحلات carpooling متاحة
**Query Parameters:**
- `pickupLat`, `pickupLng`
- `dropoffLat`, `dropoffLng`
- `radius` (km)

---

## 🟢 المرحلة 3: APIs متوسطة الأولوية (Medium Priority)

### 7. Support Tickets - تذاكر الدعم (5 APIs)

#### ❌ GET `/api/support/tickets`
**الوصف:** قائمة تذاكري

#### ❌ POST `/api/support/tickets`
**الوصف:** إنشاء تذكرة دعم جديدة
**Request Body:**
```json
{
  "subject": "Problem with payment",
  "message": "I was charged twice for the same ride"
}
```

#### ❌ GET `/api/support/tickets/{id}`
**الوصف:** تفاصيل تذكرة

#### ❌ PATCH `/api/support/tickets/{id}`
**الوصف:** تحديث تذكرة (إغلاق، إضافة رد)

#### ❌ GET `/api/admin/support/tickets`
**الوصف:** كل التذاكر (للأدمن)

---

### 8. Admin - Statistics & Analytics (4 APIs)

#### ❌ GET `/api/admin/stats/rides`
**الوصف:** إحصائيات الرحلات (يومي، شهري)
**Query Parameters:**
- `period` (daily | weekly | monthly)
- `startDate`, `endDate`

#### ❌ GET `/api/admin/stats/revenue`
**الوصف:** إحصائيات الإيرادات

#### ❌ GET `/api/admin/stats/drivers`
**الوصف:** إحصائيات السواقين

#### ❌ GET `/api/admin/stats/users`
**الوصف:** إحصائيات المستخدمين

---

### 9. Notifications - الإشعارات (4 APIs)

#### ❌ GET `/api/notifications`
**الوصف:** قائمة إشعاراتي

#### ❌ PATCH `/api/notifications/{id}/read`
**الوصف:** تعليم إشعار كمقروء

#### ❌ DELETE `/api/notifications/{id}`
**الوصف:** حذف إشعار

#### ❌ POST `/api/admin/notifications/send`
**الوصف:** إرسال إشعار (للأدمن)

---

## 🔵 المرحلة 4: APIs منخفضة الأولوية (Nice to Have)

### 10. User Preferences & Settings (2 APIs)

#### ❌ GET `/api/profile/settings`
**الوصف:** إعدادات المستخدم

#### ❌ PATCH `/api/profile/settings`
**الوصف:** تحديث الإعدادات

---

### 11. Ride History & Reports (3 APIs)

#### ❌ GET `/api/rides/history`
**الوصف:** سجل رحلاتي الكامل

#### ❌ GET `/api/rides/export`
**الوصف:** تصدير سجل الرحلات (CSV/PDF)

#### ❌ GET `/api/admin/reports/rides`
**الوصف:** تقرير الرحلات (للأدمن)

---

### 12. Favorites & Saved Locations (3 APIs)

#### ❌ GET `/api/profile/favorites`
**الوصف:** مواقعي المفضلة

#### ❌ POST `/api/profile/favorites`
**الوصف:** إضافة موقع مفضل

#### ❌ DELETE `/api/profile/favorites/{id}`
**الوصف:** حذف موقع مفضل

---

### 13. Promo Codes & Discounts (3 APIs)

#### ❌ POST `/api/rides/{id}/apply-promo`
**الوصف:** تطبيق كود خصم

#### ❌ GET `/api/admin/promo-codes`
**الوصف:** قائمة أكواد الخصم

#### ❌ POST `/api/admin/promo-codes`
**الوصف:** إنشاء كود خصم

---

## 📊 ملخص الإحصائيات

| الفئة | APIs الناقصة | الأولوية |
|------|--------------|----------|
| Admin - Drivers | 5 | 🔴 Critical |
| Driver Profile | 2 | 🔴 Critical |
| Driver Status/Online | 3 | 🔴 Critical |
| **المجموع المرحلة 1** | **10** | **🔴** |
| Reviews | 4 | 🟡 High |
| Payments | 5 | 🟡 High |
| Carpooling | 4 | 🟡 High |
| **المجموع المرحلة 2** | **13** | **🟡** |
| Support Tickets | 5 | 🟢 Medium |
| Statistics | 4 | 🟢 Medium |
| Notifications | 4 | 🟢 Medium |
| **المجموع المرحلة 3** | **13** | **🟢** |
| Settings | 2 | 🔵 Low |
| History/Reports | 3 | 🔵 Low |
| Favorites | 3 | 🔵 Low |
| Promo Codes | 3 | 🔵 Low |
| **المجموع المرحلة 4** | **11** | **🔵** |
| **المجموع الكلي** | **47** | |

---

## 🎯 خطة التنفيذ الموصى بها

### المرحلة 1 (أساسية - أسبوع واحد)
**الهدف:** MVP كامل وظيفياً للسواقين والأدمن

1. **Admin Drivers APIs** (5 APIs) - يومين
   - إدارة السواقين بالكامل
   - الموافقة على السواقين الجدد

2. **Driver Profile APIs** (2 APIs) - يوم واحد
   - السائق يقدر يشوف ويحدث بروفايله

3. **Driver Status/Online APIs** (3 APIs) - يومين
   - نظام الاتصال والموقع الحي
   - البحث عن سواقين قريبين

**النتيجة:** نظام كامل لإدارة السواقين + نظام الاتصال

---

### المرحلة 2 (مهمة - أسبوعين)
**الهدف:** تجربة مستخدم كاملة

1. **Reviews APIs** (4 APIs) - 3 أيام
   - نظام التقييمات

2. **Payments APIs** (5 APIs) - 4 أيام
   - نظام الدفع الكامل

3. **Carpooling APIs** (4 APIs) - 3 أيام
   - مشاركة الركوب

**النتيجة:** تطبيق متكامل جاهز للإطلاق

---

### المرحلة 3 (تحسينات - أسبوعين)
**الهدف:** دعم العملاء والتحليلات

1. **Support Tickets** (5 APIs)
2. **Statistics** (4 APIs)
3. **Notifications** (4 APIs)

---

### المرحلة 4 (ميزات إضافية - حسب الحاجة)
- Settings
- History/Reports
- Favorites
- Promo Codes

---

## 🔧 ملاحظات تقنية

### قاعدة البيانات
جميع الجداول موجودة في `schema.prisma`:
- ✅ User, Driver, Ride
- ✅ Payment, Review
- ✅ SupportTicket
- ✅ RidePassenger (carpooling)
- ✅ Negotiation
- ⚠️ قد نحتاج إضافة:
  - Notification table
  - UserSettings table
  - FavoriteLocation table
  - PromoCode table

### Authentication
- ✅ JWT موجود ويعمل
- ✅ Role-based access موجود
- ✅ Middleware للتحقق موجود

### Real-time
- ✅ Socket.io موجود
- ✅ Location tracking موجود
- يحتاج توسيع للإشعارات

---

## 📝 الخلاصة

المشروع متقدم بشكل جيد مع **19 API موجودة** من أصل **66 API مخططة**.

**للحصول على MVP جاهز للإطلاق:**
- نحتاج تنفيذ **المرحلة 1 + المرحلة 2** = **23 API**
- مدة تقديرية: **3-4 أسابيع**
- بعدها التطبيق يكون جاهز للاستخدام الفعلي

**الأولوية القصوى:**
1. Admin Drivers Management (لإدارة السواقين)
2. Driver Profile & Status (للسواقين)
3. Reviews & Payments (لتجربة المستخدم)

---

تم إنشاء هذا التقرير بواسطة Kiro AI
التاريخ: 4 مايو 2026
