# Driver API Documentation

## Overview

هذا الـ API يوفر endpoints للتعامل مع السائقين (Drivers) في التطبيق.

## Base URL

```
/api/drivers
```

## Authentication

معظم الـ endpoints تتطلب JWT token في الـ header:

```
Authorization: Bearer <token>
```

---

## Public Endpoints

### 1. Get Driver Profile

جلب معلومات سائق معين (public - لا يحتاج authentication)

**Endpoint:** `GET /api/drivers/:id`

**Parameters:**
- `id` (path) - Driver ID

**Response:**
```json
{
  "id": 1,
  "userId": 5,
  "licenseNumber": "ABC123",
  "carModel": "Toyota Camry",
  "carPlate": "12345",
  "carColor": "White",
  "carYear": 2020,
  "isApproved": true,
  "isOnline": true,
  "latitude": 33.8938,
  "longitude": 35.5018,
  "lastLocationUpdate": "2026-05-07T10:30:00Z",
  "rating": 4.5,
  "totalRides": 150,
  "user": {
    "id": 5,
    "name": "Ahmad",
    "email": "ahmad@example.com",
    "phone": "+96170123456",
    "avatarUrl": "https://...",
    "role": "DRIVER",
    "isVerified": true
  }
}
```

---

### 2. Get Driver Statistics

جلب إحصائيات سائق معين (public)

**Endpoint:** `GET /api/drivers/:id/stats`

**Parameters:**
- `id` (path) - Driver ID

**Response:**
```json
{
  "rating": 4.5,
  "totalRides": 150,
  "completedRides": 145,
  "totalEarnings": 5000.00
}
```

---

### 3. Get Driver Reviews

جلب تقييمات سائق معين (public)

**Endpoint:** `GET /api/drivers/:id/reviews`

**Parameters:**
- `id` (path) - Driver ID
- `page` (query, optional) - Page number (default: 1)
- `limit` (query, optional) - Items per page (default: 10, max: 100)

**Response:**
```json
{
  "reviews": [
    {
      "id": 1,
      "rideId": 10,
      "rating": 5,
      "comment": "Great driver!",
      "createdAt": "2026-05-07T10:00:00Z",
      "client": {
        "id": 2,
        "name": "Sara",
        "avatarUrl": "https://..."
      },
      "ride": {
        "id": 10,
        "pickupAddress": "Beirut",
        "dropoffAddress": "Tripoli",
        "completedAt": "2026-05-07T09:30:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### 4. Get Nearby Drivers

البحث عن السائقين القريبين من موقع معين (public)

**Endpoint:** `GET /api/drivers/nearby`

**Query Parameters:**
- `latitude` (required) - Latitude (-90 to 90)
- `longitude` (required) - Longitude (-180 to 180)
- `radiusKm` (optional) - Search radius in kilometers (default: 5)

**Example:**
```
GET /api/drivers/nearby?latitude=33.8938&longitude=35.5018&radiusKm=10
```

**Response:**
```json
{
  "drivers": [
    {
      "id": 1,
      "userId": 5,
      "carModel": "Toyota Camry",
      "carPlate": "12345",
      "carColor": "White",
      "rating": 4.5,
      "latitude": 33.8950,
      "longitude": 35.5020,
      "distance": 0.15,
      "user": {
        "id": 5,
        "name": "Ahmad",
        "avatarUrl": "https://..."
      }
    }
  ],
  "count": 1
}
```

---

## Authenticated Endpoints (Driver Only)

هذه الـ endpoints تتطلب JWT token وأن يكون الـ role = "DRIVER"

### 5. Get My Profile

جلب معلومات السائق الحالي

**Endpoint:** `GET /api/drivers/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "userId": 5,
  "licenseNumber": "ABC123",
  "carModel": "Toyota Camry",
  "carPlate": "12345",
  "carColor": "White",
  "carYear": 2020,
  "isApproved": true,
  "isOnline": true,
  "latitude": 33.8938,
  "longitude": 35.5018,
  "lastLocationUpdate": "2026-05-07T10:30:00Z",
  "rating": 4.5,
  "totalRides": 150,
  "user": {
    "id": 5,
    "name": "Ahmad",
    "email": "ahmad@example.com",
    "phone": "+96170123456",
    "avatarUrl": "https://...",
    "role": "DRIVER",
    "isVerified": true
  }
}
```

---

### 6. Get My Statistics

جلب إحصائيات السائق الحالي

**Endpoint:** `GET /api/drivers/me/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "rating": 4.5,
  "totalRides": 150,
  "completedRides": 145,
  "totalEarnings": 5000.00
}
```

---

### 7. Get My Reviews

جلب تقييمات السائق الحالي

**Endpoint:** `GET /api/drivers/me/reviews`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)

**Response:**
```json
{
  "reviews": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### 8. Get My Rides

جلب رحلات السائق الحالي

**Endpoint:** `GET /api/drivers/me/rides`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional) - Filter by ride status (REQUESTED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10, max: 100)

**Example:**
```
GET /api/drivers/me/rides?status=COMPLETED&page=1&limit=20
```

**Response:**
```json
{
  "rides": [
    {
      "id": 10,
      "status": "COMPLETED",
      "type": "STANDARD",
      "pickupLat": 33.8938,
      "pickupLng": 35.5018,
      "pickupAddress": "Beirut",
      "dropoffLat": 34.4367,
      "dropoffLng": 35.8333,
      "dropoffAddress": "Tripoli",
      "fare": 50.00,
      "distance": 85.5,
      "duration": 5400,
      "requestedAt": "2026-05-07T08:00:00Z",
      "completedAt": "2026-05-07T09:30:00Z",
      "client": {
        "id": 2,
        "name": "Sara",
        "phone": "+96170987654",
        "avatarUrl": "https://..."
      },
      "payment": {
        "amount": 50.00,
        "method": "CASH",
        "status": "PAID"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 145,
    "totalPages": 15
  }
}
```

---

### 9. Update My Location

تحديث موقع السائق الحالي

**Endpoint:** `PUT /api/drivers/location`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "latitude": 33.8938,
  "longitude": 35.5018
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 5,
  "latitude": 33.8938,
  "longitude": 35.5018,
  "lastLocationUpdate": "2026-05-07T10:30:00Z",
  ...
}
```

**Notes:**
- يجب تحديث الموقع بشكل دوري (كل 10-30 ثانية) عندما يكون السائق online
- الـ `lastLocationUpdate` يتم تحديثه تلقائياً

---

### 10. Update My Status

تحديث حالة السائق (online/offline)

**Endpoint:** `PUT /api/drivers/status`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "isOnline": true
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 5,
  "isOnline": true,
  ...
}
```

**Notes:**
- السائق يجب أن يكون approved قبل ما يقدر يروح online
- إذا السائق مش approved، رح يرجع error 403

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input",
  "details": [...]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Only drivers can access this endpoint"
}
```

### 404 Not Found
```json
{
  "error": "Driver not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Usage Examples

### JavaScript/TypeScript

```typescript
// Get nearby drivers
const response = await fetch(
  '/api/drivers/nearby?latitude=33.8938&longitude=35.5018&radiusKm=5'
);
const { drivers, count } = await response.json();

// Update driver location (authenticated)
const response = await fetch('/api/drivers/location', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    latitude: 33.8938,
    longitude: 35.5018,
  }),
});

// Get my rides
const response = await fetch(
  '/api/drivers/me/rides?status=COMPLETED&page=1&limit=20',
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
);
const { rides, pagination } = await response.json();
```

---

## Best Practices

### Location Updates
1. تحديث الموقع كل 10-30 ثانية عندما السائق online
2. إيقاف التحديثات عندما السائق offline
3. استخدام Geolocation API في المتصفح أو native APIs في الموبايل

### Status Management
1. تحديث الحالة لـ offline عند إغلاق التطبيق
2. تحديث الحالة لـ offline عند قبول رحلة (optional)
3. السماح للسائق بالرجوع online بعد إكمال الرحلة

### Performance
1. استخدام pagination في كل الـ list endpoints
2. Cache الـ driver profile locally
3. استخدام WebSockets للـ real-time updates (future enhancement)

---

## Future Enhancements

1. **Real-time Updates**
   - WebSocket connection للـ location updates
   - Real-time ride requests

2. **Advanced Filtering**
   - Filter by car type
   - Filter by rating
   - Filter by price range

3. **Analytics**
   - Daily/weekly/monthly reports
   - Performance metrics
   - Earnings breakdown

4. **Notifications**
   - Push notifications for new rides
   - SMS notifications
   - Email notifications
