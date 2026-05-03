# 🧪 صفحات الاختبار - Ride System Test Pages

## 📋 نظرة عامة

تم إنشاء صفحتين شاملتين لاختبار جميع مزايا نظام الرحلات:

1. **صفحة العميل (Client)**: `/test-client`
2. **صفحة السائق (Driver)**: `/test-driver`

---

## 🚀 البدء السريع

### 1. تثبيت المكتبات (مثبتة مسبقاً)

```bash
# المكتبات موجودة في package.json
pnpm install
```

### 2. إضافة Google Maps API Key

1. احصل على API key من: https://console.cloud.google.com/google/maps-apis
2. فعّل APIs التالية:
   - Maps JavaScript API
   - Directions API
   - Geocoding API
3. أضف الـ key في ملف `.env`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3. تشغيل المشروع

```bash
# تشغيل Next.js + Socket Server
pnpm dev

# أو تشغيلهم منفصلين
pnpm dev:next    # Next.js على port 3000
pnpm dev:socket  # Socket.IO على port 3001
```

### 4. الحصول على JWT Token

استخدم أحد الطرق التالية:

**أ. تسجيل دخول عادي:**
```bash
# للعميل
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+963911111111"}'

# ثم التحقق من OTP
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+963911111111", "code": "123456"}'
```

**ب. استخدام السكريبت الموجود:**
```bash
pnpm test:auth:interactive
```

---

## 📱 صفحة العميل (Client Test Page)

**الرابط:** `http://localhost:3000/test-client`

### المزايا المتاحة:

#### 1️⃣ إنشاء رحلة جديدة
- ✅ اختيار نقاط الانطلاق والوصول من الخريطة
- ✅ إدخال الإحداثيات يدوياً
- ✅ اختيار نوع الرحلة (Standard / Carpooling)
- ✅ تحديد عدد الركاب (للـ Carpooling)
- ✅ عرض المسار على الخريطة
- ✅ حساب السعر والمسافة تلقائياً

#### 2️⃣ عرض الرحلات
- ✅ قائمة بجميع رحلاتك
- ✅ فلترة حسب الحالة
- ✅ تفاصيل كل رحلة

#### 3️⃣ التفاوض على السعر
- ✅ بدء تفاوض جديد
- ✅ إرسال عرض مع رسالة
- ✅ قبول/رفض عرض السائق
- ✅ عرض سجل التفاوض

#### 4️⃣ تتبع الرحلة
- ✅ عرض موقع السائق في الوقت الفعلي
- ✅ تحديثات الحالة الفورية
- ✅ معلومات السائق (الاسم، الهاتف، السيارة)

#### 5️⃣ إلغاء الرحلة
- ✅ إلغاء رحلة قبل بدئها
- ✅ إضافة سبب الإلغاء

#### 6️⃣ Socket.IO
- ✅ اتصال فوري بالسيرفر
- ✅ إشعارات عند قبول الرحلة
- ✅ إشعارات عند تحديث التفاوض
- ✅ إشعارات عند إلغاء الرحلة

---

## 🚕 صفحة السائق (Driver Test Page)

**الرابط:** `http://localhost:3000/test-driver`

### المزايا المتاحة:

#### 1️⃣ عرض الرحلات القريبة
- ✅ قائمة بالرحلات المتاحة
- ✅ حساب المسافة من موقع السائق
- ✅ فلترة حسب المسافة القصوى
- ✅ معلومات العميل والسعر
- ✅ قبول الرحلة بضغطة واحدة

#### 2️⃣ إدارة الرحلات النشطة
- ✅ قائمة برحلاتك الحالية
- ✅ تحديث حالة الرحلة:
  - `ACCEPTED` → `DRIVER_ARRIVED` (وصلت)
  - `DRIVER_ARRIVED` → `IN_PROGRESS` (بدء الرحلة)
  - `IN_PROGRESS` → `COMPLETED` (إنهاء الرحلة)
- ✅ إلغاء الرحلة

#### 3️⃣ التفاوض على السعر
- ✅ عرض طلب التفاوض من العميل
- ✅ إرسال عرض مضاد
- ✅ قبول/رفض عرض العميل
- ✅ عرض سجل التفاوض الكامل

#### 4️⃣ تتبع الموقع
- ✅ إرسال موقعك للعميل تلقائياً
- ✅ يعمل فقط عند تفعيل "Online"
- ✅ يرسل الموقع كل 3 ثواني

#### 5️⃣ عرض المسار
- ✅ خريطة تفاعلية مع المسار
- ✅ نقطة الانطلاق والوصول
- ✅ حساب المسافة والوقت

#### 6️⃣ حالة الاتصال
- ✅ زر Online/Offline
- ✅ مؤشر اتصال Socket.IO
- ✅ إشعارات فورية للرحلات الجديدة

---

## 🎯 سيناريوهات الاختبار

### سيناريو 1: رحلة عادية ناجحة

1. **العميل:**
   - افتح `/test-client`
   - أدخل Token و User ID
   - اختر نقطتين على الخريطة
   - اضغط "Create Ride"

2. **السائق:**
   - افتح `/test-driver`
   - أدخل Token و User ID
   - فعّل "Online"
   - اضغط "Load Rides"
   - اضغط "Accept" على الرحلة

3. **السائق:**
   - اضغط "I've Arrived"
   - اضغط "Start Ride"
   - اضغط "Complete Ride"

4. **العميل:**
   - شاهد التحديثات الفورية
   - شاهد موقع السائق على الخريطة

---

### سيناريو 2: رحلة مع تفاوض

1. **العميل:**
   - أنشئ رحلة جديدة
   - في قسم "Start Negotiation":
     - أدخل سعر أقل (مثلاً 6.0)
     - أضف رسالة "السعر غالي شوي"
     - اضغط "Send Offer"

2. **السائق:**
   - اقبل الرحلة
   - في قسم "Negotiation":
     - شاهد عرض العميل
     - أدخل عرض مضاد (مثلاً 7.0)
     - أضف رسالة "أقل شي 7"
     - اضغط "Counter Offer"

3. **العميل:**
   - شاهد الإشعار
   - اضغط "Accept" أو "Reject"

4. **السائق:**
   - إذا قبل العميل، السعر النهائي يتحدث تلقائياً

---

### سيناريو 3: Carpooling

1. **العميل:**
   - اختر "Carpooling" من القائمة
   - حدد عدد الركاب (2-4)
   - أنشئ الرحلة

2. **السائق:**
   - اقبل الرحلة
   - شاهد عدد المقاعد المتاحة

---

### سيناريو 4: إلغاء رحلة

1. **العميل أو السائق:**
   - اضغط "Cancel" على الرحلة
   - أكد الإلغاء
   - شاهد الإشعار للطرف الآخر

---

## 🔧 استكشاف الأخطاء

### المشكلة: الخريطة لا تظهر

**الحل:**
- تأكد من إضافة `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` في `.env`
- تأكد من تفعيل Maps JavaScript API
- أعد تشغيل السيرفر بعد إضافة الـ key

### المشكلة: Socket غير متصل

**الحل:**
- تأكد من تشغيل Socket Server على port 3001
- تحقق من `NEXT_PUBLIC_SOCKET_URL` في `.env`
- تأكد من إدخال User ID الصحيح

### المشكلة: "Unauthorized" عند الطلبات

**الحل:**
- تأكد من إدخال JWT Token صحيح
- تحقق من صلاحيات المستخدم (CLIENT أو DRIVER)
- جرب الحصول على token جديد

### المشكلة: موقع السائق لا يظهر

**الحل:**
- تأكد من تفعيل "Online" في صفحة السائق
- اسمح للمتصفح بالوصول للموقع
- تأكد من أن الرحلة في حالة `IN_PROGRESS`

---

## 📊 البيانات المعروضة

### في صفحة العميل:
```typescript
{
  id: number;
  status: string;
  pickup: { lat, lng, address };
  dropoff: { lat, lng, address };
  systemFare: number;
  fare: number;
  distance: number;
  driver: {
    name: string;
    phone: string;
    carModel: string;
    carPlate: string;
  };
  negotiation: {
    status: string;
    clientOffer: number;
    driverCounter: number;
    agreedFare: number;
  };
}
```

### في صفحة السائق:
```typescript
{
  id: number;
  status: string;
  distanceFromDriver: number;
  client: {
    name: string;
    phone: string;
  };
  negotiation: {
    history: Array<{
      offeredBy: string;
      amount: number;
      message: string;
    }>;
  };
}
```

---

## 🎨 الألوان والحالات

### حالات الرحلة:
- 🟡 `REQUESTED` - بانتظار سائق
- 🟢 `ACCEPTED` - سائق قبل الرحلة
- 🔵 `DRIVER_ARRIVED` - السائق وصل
- 🟣 `IN_PROGRESS` - الرحلة بدأت
- ✅ `COMPLETED` - الرحلة انتهت
- ❌ `CANCELLED` - الرحلة ألغيت

### حالات التفاوض:
- 🟡 `PENDING` - بانتظار رد
- 🔵 `COUNTERED` - عرض مضاد
- ✅ `ACCEPTED` - تم الاتفاق
- ❌ `REJECTED` - رُفض
- ⏰ `EXPIRED` - انتهت المهلة

---

## 🔌 Socket.IO Events

### Events للعميل:
- `ride:created` - رحلة جديدة أُنشئت
- `ride:accepted` - سائق قبل الرحلة
- `ride:location` - موقع السائق
- `ride:in_progress` - الرحلة بدأت
- `ride:completed` - الرحلة انتهت
- `ride:cancelled` - الرحلة ألغيت
- `negotiation:updated` - تحديث التفاوض

### Events للسائق:
- `ride:created` - رحلة جديدة متاحة
- `ride:accepted` - رحلة قُبلت
- `ride:cancelled` - رحلة ألغيت
- `negotiation:updated` - تحديث التفاوض

### Events يرسلها السائق:
- `driver:location` - إرسال الموقع
- `ride:join` - الانضمام لغرفة الرحلة

---

## 📝 ملاحظات مهمة

1. **Google Maps API Key:**
   - مطلوب لعرض الخرائط
   - يجب أن يبدأ بـ `NEXT_PUBLIC_`
   - يجب إعادة تشغيل السيرفر بعد إضافته

2. **Socket.IO:**
   - يجب تشغيل Socket Server على port 3001
   - يجب إدخال User ID للاتصال
   - الاتصال يتم تلقائياً عند إدخال User ID

3. **Geolocation:**
   - يطلب إذن المتصفح
   - يعمل فقط على HTTPS أو localhost
   - يرسل الموقع كل 3 ثواني

4. **JWT Token:**
   - يجب أن يكون صالحاً
   - يجب أن يحتوي على الصلاحيات الصحيحة
   - ينتهي بعد مدة معينة

---

## 🚀 التطوير المستقبلي

### مزايا يمكن إضافتها:

1. **للعميل:**
   - [ ] تقييم السائق بعد الرحلة
   - [ ] عرض سجل الرحلات السابقة
   - [ ] حفظ الأماكن المفضلة
   - [ ] دعوة راكب آخر للـ Carpooling

2. **للسائق:**
   - [ ] إحصائيات الأرباح
   - [ ] تقييمات العملاء
   - [ ] تحديد ساعات العمل
   - [ ] رفض رحلات معينة

3. **عامة:**
   - [ ] دعم اللغة العربية بالكامل
   - [ ] وضع الليل/النهار
   - [ ] إشعارات صوتية
   - [ ] دعم PWA

---

## 📞 الدعم

إذا واجهت أي مشكلة:

1. تحقق من Console في المتصفح
2. تحقق من logs السيرفر
3. تأكد من تشغيل Socket Server
4. تأكد من صحة JWT Token

---

**تم الإنشاء:** 3 مايو 2026  
**الإصدار:** 1.0.0  
**المكتبات المستخدمة:**
- `@react-google-maps/api` v2.20.8
- `socket.io-client` v4.8.3
- `next` v16.2.3
