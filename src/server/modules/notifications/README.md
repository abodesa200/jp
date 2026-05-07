# Notifications Module

This module handles all notification-related operations for the ride-sharing platform.

## Features

- ✅ Get user notifications (with pagination)
- ✅ Get unread notifications only
- ✅ Get unread count
- ✅ Mark notification as read
- ✅ Mark all notifications as read
- ✅ Delete notification
- ✅ Delete all notifications
- ✅ Create notification (Admin only)
- ✅ Send bulk notifications (Admin only)
- ✅ Helper functions for internal use

## Structure

```
notifications/
├── notification.repository.ts  # Database operations
├── notification.schema.ts      # Zod validation schemas
├── notification.service.ts     # Business logic
├── index.ts                    # Module exports
└── README.md                   # Documentation
```

## API Endpoints

### User Endpoints

- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications/all` - Delete all notifications

### Admin Endpoints

- `POST /api/admin/notifications/send` - Send notification to specific user
- `POST /api/admin/notifications/broadcast` - Send to multiple users

## Usage Examples

### Get Notifications

```typescript
// Get all notifications (paginated)
GET /api/notifications?limit=20&offset=0

// Get unread only
GET /api/notifications?unreadOnly=true
```

### Mark as Read

```typescript
PATCH /api/notifications/123/read
```

### Send Notification (Admin)

```typescript
POST /api/admin/notifications/send
{
  "userId": 5,
  "title": "رحلتك جاهزة",
  "message": "السائق في الطريق إليك"
}
```

### Broadcast (Admin)

```typescript
POST /api/admin/notifications/broadcast
{
  "userIds": [1, 2, 3, 4, 5],
  "title": "عرض خاص",
  "message": "خصم 20% على جميع الرحلات اليوم!"
}
```

## Internal Helpers

Use these functions from other modules:

```typescript
import { sendNotificationToUser, sendNotificationToUsers } from '@/server/modules/notifications';

// Send to one user
await sendNotificationToUser(
  userId,
  "رحلة جديدة",
  "لديك طلب رحلة جديد"
);

// Send to multiple users
await sendNotificationToUsers(
  [1, 2, 3],
  "تحديث النظام",
  "سيتم تحديث التطبيق غداً"
);
```

## Database Schema

```prisma
model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  title     String
  message   String
  isRead    Boolean  @default(false)
  
  createdAt DateTime @default(now())
  
  @@index([userId, isRead])
  @@index([createdAt])
}
```

## Notes

- Notifications are automatically deleted when user is deleted (CASCADE)
- Old notifications can be cleaned up using `deleteOlderThan()` repository method
- Unread count is indexed for performance
- Maximum 100 notifications per request (pagination)
