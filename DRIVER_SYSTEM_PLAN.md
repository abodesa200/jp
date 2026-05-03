# خطة تزبيط نظام السائقين 🚗

## المشكلة الحالية
- `isOnline` في DB غير موثوق
- ما في طريقة لمعرفة السائقين المتاحين فعلياً
- ما في heartbeat للتأكد من اتصال السائق

## الحل المقترح

### 1️⃣ نظام Hybrid (DB + Redis/Memory)

#### Option A: استخدام Redis (الأفضل للإنتاج)
```typescript
// في Socket server
const onlineDrivers = new Set<number>(); // في الذاكرة

socket.on("driver:online", async () => {
  onlineDrivers.add(userId);
  await redis.sadd("drivers:online", userId);
  await redis.expire(`driver:${userId}:heartbeat`, 30); // 30 ثانية
});

// Heartbeat كل 10 ثوان
socket.on("driver:heartbeat", async () => {
  await redis.expire(`driver:${userId}:heartbeat`, 30);
});
```

#### Option B: Memory-only (أبسط، للتطوير)
```typescript
// في Socket server
const onlineDrivers = new Map<number, {
  socketId: string;
  lastHeartbeat: number;
  location: { lat: number; lng: number } | null;
}>();

// تنظيف كل دقيقة
setInterval(() => {
  const now = Date.now();
  for (const [driverId, data] of onlineDrivers.entries()) {
    if (now - data.lastHeartbeat > 30000) { // 30 ثانية
      onlineDrivers.delete(driverId);
    }
  }
}, 60000);
```

### 2️⃣ API Endpoints المطلوبة

#### GET /api/drivers/online
```typescript
// يرجع السائقين المتاحين حالياً
{
  drivers: [
    {
      id: 1,
      name: "أحمد",
      rating: 4.8,
      location: { lat: 33.5, lng: 36.3 },
      carModel: "Toyota Camry",
      carPlate: "ABC123"
    }
  ]
}
```

#### POST /api/drivers/status
```typescript
// السائق يحدث حالته
{
  isOnline: true,
  location: { lat: 33.5, lng: 36.3 }
}
```

### 3️⃣ تحديثات Socket Events

```typescript
// من السائق → Server
socket.emit("driver:heartbeat", {
  location: { lat, lng }
});

// من Server → Clients
socket.on("drivers:updated", (data) => {
  // قائمة السائقين المتاحين تحدثت
});
```

### 4️⃣ React Hook محسّن

```typescript
// useDriverStatus.ts
export function useDriverStatus() {
  const [isOnline, setIsOnline] = useState(false);
  
  useEffect(() => {
    // Heartbeat كل 10 ثوان
    const interval = setInterval(() => {
      socket.emit("driver:heartbeat", {
        location: getCurrentLocation()
      });
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);
}
```

## 🎯 الخطوات التنفيذية

### المرحلة 1: Socket Server (أولوية عالية)
- [ ] إضافة `onlineDrivers` Map في الذاكرة
- [ ] إضافة `driver:heartbeat` event
- [ ] إضافة cleanup للسائقين غير النشطين
- [ ] إضافة endpoint `/socket/drivers/online` لجلب القائمة

### المرحلة 2: API Routes
- [ ] `GET /api/drivers/online` - جلب السائقين المتاحين
- [ ] `POST /api/drivers/status` - تحديث الحالة
- [ ] `GET /api/drivers/nearby` - سائقين قريبين من موقع معين

### المرحلة 3: Frontend
- [ ] `useDriverStatus` hook للسائق
- [ ] `useNearbyDrivers` hook للزبون
- [ ] تحديث `useDriverLocation` ليشمل heartbeat

### المرحلة 4: Testing
- [ ] اختبار disconnect مفاجئ
- [ ] اختبار heartbeat timeout
- [ ] اختبار تحديث الموقع

## 🔍 ملاحظات مهمة

1. **لا تعتمد على `isOnline` في DB** - استخدمه فقط للإحصائيات
2. **Source of Truth** = Socket Server memory/Redis
3. **Heartbeat** = 10 ثوان، Timeout = 30 ثانية
4. **Location Update** = كل 3 ثوان (موجود حالياً)

## 🚀 بدك نبدأ بأي مرحلة؟

اقترح نبدأ بالمرحلة 1 (Socket Server) لأنها الأساس.
