# 🚗 Rides API Documentation

## Overview

APIs لإدارة الرحلات، التفاوض على الأسعار، وتتبع الحالة.

---

## 📍 Endpoints

### 1. إنشاء رحلة جديدة

```http
POST /api/rides
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "pickupLat": 33.5138,
  "pickupLng": 36.2765,
  "pickupAddress": "Damascus, Syria",
  "dropoffLat": 33.5102,
  "dropoffLng": 36.2913,
  "dropoffAddress": "Umayyad Square, Damascus",
  "type": "STANDARD",
  "maxPassengers": 1
}
```

**Response:**

```json
{
  "ride": {
    "id": "uuid",
    "status": "REQUESTED",
    "pickup": { "lat": 33.5138, "lng": 36.2765, "address": "..." },
    "dropoff": { "lat": 33.5102, "lng": 36.2913, "address": "..." },
    "systemFare": 12.5,
    "distance": 3.75,
    "estimatedDuration": 6,
    "type": "STANDARD",
    "requestedAt": "2026-04-25T18:00:00Z"
  }
}
```

---

### 2. جلب رحلات المستخدم

```http
GET /api/rides?status=REQUESTED&page=1&limit=10
Authorization: Bearer {token}
```

**Query Parameters:**

- `status` (optional): REQUESTED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED
- `page` (optional): رقم الصفحة (default: 1)
- `limit` (optional): عدد النتائج (default: 10, max: 50)

**Response:**

```json
{
  "rides": [...],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

---

### 3. تفاصيل رحلة

```http
GET /api/rides/:id
Authorization: Bearer {token}
```

**Response:**

```json
{
  "ride": {
    "id": "uuid",
    "status": "ACCEPTED",
    "client": { "id": 1, "name": "Ahmad", "phone": "+963..." },
    "driver": {
      "id": 1,
      "user": { "id": 2, "name": "Mohammed", "phone": "+963..." },
      "carModel": "Toyota Camry",
      "carPlate": "ABC123",
      "rating": 4.8
    },
    "negotiation": { ... },
    "payment": { ... },
    "review": { ... }
  }
}
```

---

### 4. أقرب الرحلات للسائق

```http
GET /api/rides/nearby?maxDistance=10&limit=10
Authorization: Bearer {token} (Driver only)
```

**Query Parameters:**

- `maxDistance` (optional): أقصى مسافة بالكيلومتر (default: 10)
- `limit` (optional): عدد النتائج (default: 10, max: 20)

**Response:**

```json
{
  "rides": [
    {
      "id": "uuid",
      "status": "REQUESTED",
      "pickup": { "lat": 33.5138, "lng": 36.2765 },
      "systemFare": 12.5,
      "distanceFromDriver": 2.3,
      "client": { "name": "Ahmad", "phone": "+963..." }
    }
  ],
  "driverLocation": { "lat": 33.51, "lng": 36.28 },
  "filters": { "maxDistance": 10, "limit": 10 }
}
```

---

### 5. قبول الرحلة (السائق)

```http
POST /api/rides/:id/accept
Authorization: Bearer {token} (Driver only)
```

**Response:**

```json
{
  "ride": { ... },
  "message": "Ride accepted successfully"
}
```

**Requirements:**

- السائق لازم يكون موافق عليه (`isApproved: true`)
- السائق لازم يكون متصل (`isOnline: true`)
- الرحلة لازم تكون بحالة `REQUESTED`

---

### 6. تحديث حالة الرحلة

```http
PATCH /api/rides/:id
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "status": "IN_PROGRESS"
}
```

**Possible Status Transitions:**

- `REQUESTED` → `ACCEPTED` (السائق يقبل)
- `ACCEPTED` → `DRIVER_ARRIVED` (السائق وصل)
- `DRIVER_ARRIVED` → `IN_PROGRESS` (بدء الرحلة)
- `IN_PROGRESS` → `COMPLETED` (إنهاء الرحلة)
- Any → `CANCELLED` (إلغاء)

---

### 7. إلغاء الرحلة

```http
POST /api/rides/:id/cancel
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "reason": "Changed my mind"
}
```

**Response:**

```json
{
  "ride": { ... },
  "message": "Ride cancelled successfully"
}
```

---

### 8. بدء التفاوض أو إرسال عرض مضاد

```http
POST /api/rides/:id/negotiate
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "amount": 10.0,
  "message": "Can you do 10?"
}
```

**Response:**

```json
{
  "negotiation": {
    "id": "uuid",
    "rideId": "uuid",
    "systemFare": 12.5,
    "clientOffer": 10.0,
    "driverCounter": null,
    "status": "PENDING",
    "expiresAt": "2026-04-25T18:05:00Z",
    "history": [
      {
        "offeredBy": "CLIENT",
        "amount": 10.0,
        "message": "Can you do 10?",
        "createdAt": "2026-04-25T18:00:00Z"
      }
    ]
  },
  "message": "Negotiation started successfully"
}
```

**Flow:**

1. الزبون يبدأ التفاوض بعرض سعر أقل
2. السائق يرد بعرض مضاد (أو يقبل/يرفض)
3. الزبون يقبل أو يرفض عرض السائق
4. إذا تم الاتفاق → `status: ACCEPTED` و `agreedFare` يتحدد

---

### 9. قبول أو رفض التفاوض

```http
PATCH /api/rides/:id/negotiate
Authorization: Bearer {token}
```

**Request Body:**

```json
{
  "action": "accept"
}
```

أو

```json
{
  "action": "reject"
}
```

**Response (Accept):**

```json
{
  "negotiation": {
    "status": "ACCEPTED",
    "agreedFare": 10.0,
    ...
  },
  "message": "Negotiation accepted successfully"
}
```

---

## 🔄 Ride Status Flow

```
REQUESTED
    ↓ (Driver accepts)
ACCEPTED
    ↓ (Driver arrives)
DRIVER_ARRIVED
    ↓ (Trip starts)
IN_PROGRESS
    ↓ (Trip ends)
COMPLETED
    ↓ (Payment + Review)
```

**أو:**

```
Any Status → CANCELLED (with reason)
```

---

## 💰 Fare Calculation

```typescript
baseFare = 5; // سعر البداية
perKm = 2; // سعر الكيلومتر
minFare = 5; // أقل سعر

fare = baseFare + distance * perKm;
fare = max(fare, minFare);
```

**مثال:**

- مسافة: 3.75 km
- السعر: 5 + (3.75 × 2) = 12.5

---

## 📏 Distance Calculation

استخدام **Haversine formula** لحساب المسافة بين نقطتين GPS:

```typescript
function calculateDistance(lat1, lng1, lat2, lng2): number {
  // Returns distance in kilometers
}
```

---

## ⏱️ Negotiation Expiry

- مدة التفاوض: **5 دقائق**
- بعد انتهاء المهلة: `status: EXPIRED`
- الرحلة ترجع `REQUESTED` ويقدر الزبون يطلب من جديد

---

## 🔐 Permissions

| Endpoint                   | Client   | Driver        | Admin    |
| -------------------------- | -------- | ------------- | -------- |
| POST /rides                | ✅       | ❌            | ✅       |
| GET /rides                 | ✅ (own) | ✅ (own)      | ✅ (all) |
| GET /rides/:id             | ✅ (own) | ✅ (assigned) | ✅       |
| GET /rides/nearby          | ❌       | ✅            | ❌       |
| POST /rides/:id/accept     | ❌       | ✅            | ❌       |
| PATCH /rides/:id           | ✅ (own) | ✅ (assigned) | ✅       |
| POST /rides/:id/cancel     | ✅ (own) | ✅ (assigned) | ✅       |
| POST /rides/:id/negotiate  | ✅       | ✅            | ❌       |
| PATCH /rides/:id/negotiate | ✅       | ✅            | ❌       |

---

## 🚨 Error Responses

```json
{
  "error": "Error message here"
}
```

**Common Status Codes:**

- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔜 TODO: WebSocket Integration

الـ APIs جاهزة بس لسا ما ربطناها بالـ WebSocket. لازم نضيف:

```typescript
// بعد كل عملية مهمة
io.to(`user:${userId}`).emit("ride:status_changed", { ride });
io.to("drivers").emit("ride:new_request", { ride });
```

**Events:**

- `ride:new_request` - رحلة جديدة للسواقين
- `ride:accepted` - السائق قبل الرحلة
- `ride:status_changed` - تغيير حالة الرحلة
- `ride:cancelled` - إلغاء الرحلة
- `negotiation:new_offer` - عرض جديد في التفاوض
- `negotiation:accepted` - قبول التفاوض
