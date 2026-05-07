# Notification API Examples

## User Endpoints

### 1. Get All Notifications (Paginated)

```bash
GET /api/notifications?limit=20&offset=0
Authorization: Bearer <token>
```

**Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "userId": 5,
      "title": "رحلة جديدة",
      "message": "لديك طلب رحلة جديد من أحمد",
      "isRead": false,
      "createdAt": "2026-05-07T10:30:00.000Z"
    },
    {
      "id": 2,
      "userId": 5,
      "title": "تم قبول الرحلة",
      "message": "السائق محمد قبل طلبك",
      "isRead": true,
      "createdAt": "2026-05-07T09:15:00.000Z"
    }
  ],
  "unreadCount": 5,
  "total": 2
}
```

### 2. Get Unread Notifications Only

```bash
GET /api/notifications?unreadOnly=true
Authorization: Bearer <token>
```

**Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "userId": 5,
      "title": "رحلة جديدة",
      "message": "لديك طلب رحلة جديد من أحمد",
      "isRead": false,
      "createdAt": "2026-05-07T10:30:00.000Z"
    }
  ],
  "unreadCount": 5,
  "total": 1
}
```

### 3. Get Unread Count

```bash
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

**Response:**
```json
{
  "unreadCount": 5
}
```

### 4. Mark Notification as Read

```bash
PATCH /api/notifications/123
Authorization: Bearer <token>
```

**Response:**
```json
{
  "notification": {
    "id": 123,
    "userId": 5,
    "title": "رحلة جديدة",
    "message": "لديك طلب رحلة جديد",
    "isRead": true,
    "createdAt": "2026-05-07T10:30:00.000Z"
  }
}
```

### 5. Mark All Notifications as Read

```bash
PATCH /api/notifications
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "All notifications marked as read"
}
```

### 6. Delete Notification

```bash
DELETE /api/notifications/123
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Notification deleted successfully"
}
```

### 7. Delete All Notifications

```bash
DELETE /api/notifications
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "All notifications deleted successfully"
}
```

---

## Admin Endpoints

### 1. Send Notification to Single User

```bash
POST /api/admin/notifications/send
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userId": 5,
  "title": "رحلتك جاهزة",
  "message": "السائق في الطريق إليك"
}
```

**Response:**
```json
{
  "notification": {
    "id": 456,
    "userId": 5,
    "title": "رحلتك جاهزة",
    "message": "السائق في الطريق إليك",
    "isRead": false,
    "createdAt": "2026-05-07T11:00:00.000Z"
  }
}
```

### 2. Send Bulk Notifications (Broadcast)

```bash
POST /api/admin/notifications/send
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userIds": [1, 2, 3, 4, 5],
  "title": "عرض خاص",
  "message": "خصم 20% على جميع الرحلات اليوم!"
}
```

**Response:**
```json
{
  "message": "5 notifications sent successfully",
  "count": 5
}
```

---

## Internal Usage (From Other Modules)

### Send Notification from Rides Module

```typescript
import { sendNotificationToUser } from '@/server/modules/notifications';

// في حالة قبول السائق للرحلة
await sendNotificationToUser(
  ride.clientId,
  "تم قبول الرحلة",
  `السائق ${driver.user.name} قبل طلبك`
);
```

### Send Notification to Multiple Users

```typescript
import { sendNotificationToUsers } from '@/server/modules/notifications';

// إرسال إشعار لجميع السائقين المتاحين
const driverIds = availableDrivers.map(d => d.userId);
await sendNotificationToUsers(
  driverIds,
  "طلب رحلة جديد",
  "يوجد طلب رحلة جديد في منطقتك"
);
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Unauthorized",
    "code": "UNAUTHORIZED",
    "status": 401
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "message": "You don't have permission to access this notification",
    "code": "FORBIDDEN",
    "status": 403
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Notification not found",
    "code": "NOT_FOUND",
    "status": 404
  }
}
```

### 400 Validation Error
```json
{
  "success": false,
  "error": {
    "message": "Invalid input",
    "code": "VALIDATION_ERROR",
    "status": 400,
    "field": "title"
  }
}
```

---

## Notes

- All endpoints require authentication via JWT token
- Admin endpoints require `ADMIN` or `CUSTOMER_SUPPORT` role
- Pagination default: `limit=50`, `offset=0`
- Maximum limit per request: 100
- Notifications are automatically deleted when user is deleted (CASCADE)
