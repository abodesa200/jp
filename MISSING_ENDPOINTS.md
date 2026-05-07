# Missing Endpoints in openapi.yaml

تم فحص المشروع ولقيت **endpoints كثيرة مش موثقة** في ملف `openapi.yaml`. هاي القائمة الكاملة:

## 1. Profile APIs (Missing)

### `/api/profile/driver` - Driver Profile Management
- **GET** - Get driver profile (authenticated)
- **PATCH** - Update driver profile (authenticated)

### `/api/profile/settings` - User Settings
- **GET** - Get user settings (authenticated)
- **PATCH** - Update user settings (authenticated)

### `/api/profile/favorites` - Favorite Locations
- **GET** - Get favorite locations (authenticated)
- **POST** - Add favorite location (authenticated)
- **DELETE** `/api/profile/favorites/[id]` - Delete favorite (authenticated)

### `/api/profile/reviews` - User Reviews
- **GET** - Get my reviews with pagination (authenticated)

---

## 2. Drivers APIs (Missing)

### `/api/drivers/status` - Driver Status Management
- **PUT** - Update driver status (online/offline) (authenticated, driver only)

### `/api/drivers/nearby` - Nearby Drivers (Public)
- **GET** - Get nearby drivers (no auth required)
  - Query params: `latitude`, `longitude`, `radiusKm`

### `/api/drivers/[id]` - Driver Profile (Public)
- **GET** - Get driver profile by ID (no auth required)

### `/api/drivers/[id]/reviews` - Driver Reviews (Public)
- **GET** - Get driver reviews with pagination (no auth required)
  - Query params: `page`, `limit`

### `/api/drivers/[id]/stats` - Driver Statistics (Public)
- **GET** - Get driver statistics (no auth required)

---

## 3. Rides APIs (Missing)

### `/api/rides/history` - Ride History
- **GET** - Get ride history with date filtering (authenticated)
  - Query params: `status`, `type`, `startDate`, `endDate`, `page`, `limit`

### `/api/rides/export` - Export Ride History
- **GET** - Export ride history as CSV (authenticated)
  - Query params: `status`, `type`, `startDate`, `endDate`
  - Returns: CSV file

### `/api/rides/carpooling/available` - Available Carpooling Rides
- **GET** - Get available carpooling rides (authenticated)
  - Query params: `pickupLat`, `pickupLng`, `dropoffLat`, `dropoffLng`, `radius`, `limit`

### `/api/rides/[id]/join` - Join Carpooling
- **POST** - Join carpooling ride (authenticated)
  - Body: `pickupLat`, `pickupLng`, `dropoffLat`, `dropoffLng`, `pickupAddress`, `dropoffAddress`

### `/api/rides/[id]/leave` - Leave Carpooling
- **DELETE** - Leave carpooling ride (authenticated)

### `/api/rides/[id]/passengers` - Ride Passengers
- **GET** - Get ride passengers (authenticated)

### `/api/rides/[id]/apply-promo` - Apply Promo Code
- **POST** - Apply promo code to ride (authenticated)
  - Body: `promoCode`

---

## 4. Payment APIs (Missing - All)

### `/api/payments` - My Payments
- **GET** - Get my payments with filtering (authenticated)
  - Query params: `status`, `page`, `limit`

### `/api/rides/[id]/payment` - Ride Payment
- **POST** - Create payment (authenticated)
  - Body: `method` (CASH, CARD, WALLET), `amount`
- **GET** - Get ride payment (authenticated)
- **PATCH** - Update payment (authenticated)
  - Body: `status`, `transactionId`

---

## 5. Reviews APIs (Missing - All)

### `/api/rides/[id]/review` - Ride Review
- **POST** - Create review for ride (authenticated)
  - Body: `rating` (1-5), `comment`
- **GET** - Get ride review (authenticated)

---

## 6. Notifications APIs (Missing - All)

### `/api/notifications` - User Notifications
- **GET** - Get user notifications with pagination (authenticated)
  - Query params: `limit`, `offset`, `unreadOnly`
- **PATCH** - Mark all notifications as read (authenticated)
- **DELETE** - Delete all notifications (authenticated)

### `/api/notifications/unread-count` - Unread Count
- **GET** - Get unread notification count (authenticated)

### `/api/notifications/[id]` - Single Notification
- **PATCH** - Mark notification as read (authenticated)
- **DELETE** - Delete notification (authenticated)

### `/api/notifications/[id]/read` - Mark as Read (Alternative)
- **PATCH** - Mark as read (authenticated)

---

## 7. Support Tickets APIs (Missing - All)

### `/api/support/tickets` - Support Tickets
- **POST** - Create support ticket (authenticated)
  - Body: `subject`, `message`
- **GET** - Get user's support tickets (authenticated)
  - Query params: `status` (all, open, resolved), `page`, `limit`

### `/api/support/tickets/[id]` - Ticket Details
- **GET** - Get ticket by ID (authenticated)

---

## 8. Admin APIs (Missing)

### `/api/admin/drivers/pending` - Pending Drivers
- **GET** - Get pending drivers (need approval) (authenticated, admin)

### `/api/admin/stats/drivers` - Driver Statistics
- **GET** - Get driver statistics (authenticated, admin)

### `/api/admin/stats/users` - User Statistics
- **GET** - Get user statistics (authenticated, admin)

### `/api/admin/stats/rides` - Ride Statistics
- **GET** - Get ride statistics (authenticated, admin)

### `/api/admin/stats/revenue` - Revenue Statistics
- **GET** - Get revenue statistics (authenticated, admin)

### `/api/admin/payments` - Admin Payments Management
- **GET** - Get all payments (authenticated, admin)
  - Query params: `status`, `method`, `page`, `limit`, `startDate`, `endDate`

### `/api/admin/payments/[id]` - Payment Details
- **GET** - Get payment by ID (authenticated, admin)
- **PATCH** - Update payment (authenticated, admin)

### `/api/admin/payments/stats` - Payment Statistics
- **GET** - Get payment statistics (authenticated, admin)

### `/api/admin/promo-codes` - Promo Codes Management
- **GET** - Get promo codes list (authenticated, admin)
  - Query params: `isActive`, `page`, `limit`, `search`
- **POST** - Create promo code (authenticated, admin)
  - Body: `code`, `discountType` (PERCENTAGE, FIXED), `discountValue`, `maxUses`, `expiresAt`

### `/api/admin/promo-codes/[id]` - Promo Code Details
- **GET** - Get promo code by ID (authenticated, admin)
- **PATCH** - Update promo code (authenticated, admin)
- **DELETE** - Delete promo code (authenticated, admin)

### `/api/admin/promo-codes/stats` - Promo Code Statistics
- **GET** - Get promo code statistics (authenticated, admin)

### `/api/admin/support/tickets` - All Support Tickets
- **GET** - Get all support tickets (authenticated, admin)
  - Query params: `status`, `page`, `limit`

### `/api/admin/support/stats` - Support Statistics
- **GET** - Get support ticket statistics (authenticated, admin)

### `/api/admin/reports/rides` - Rides Report
- **GET** - Get admin rides report (authenticated, admin)
  - Query params: `status`, `type`, `startDate`, `endDate`, `page`, `limit`

### `/api/admin/notifications/send` - Send Notifications
- **POST** - Send notification to single/multiple users (authenticated, admin)
  - Body (single): `userId`, `title`, `message`, `type`
  - Body (bulk): `userIds`, `title`, `message`, `type`

---

## 9. New Schemas Needed

### `Notification` Schema
```yaml
Notification:
  type: object
  properties:
    id:
      type: integer
    userId:
      type: integer
    title:
      type: string
    message:
      type: string
    type:
      type: string
      enum: [RIDE_UPDATE, PAYMENT, PROMO, SYSTEM]
    isRead:
      type: boolean
    createdAt:
      type: string
      format: date-time
```

### `UserSettings` Schema
```yaml
UserSettings:
  type: object
  properties:
    id:
      type: integer
    userId:
      type: integer
    notificationsEnabled:
      type: boolean
    emailNotifications:
      type: boolean
    smsNotifications:
      type: boolean
    language:
      type: string
      enum: [en, ar]
    theme:
      type: string
      enum: [light, dark, auto]
```

### `FavoriteLocation` Schema
```yaml
FavoriteLocation:
  type: object
  properties:
    id:
      type: integer
    userId:
      type: integer
    name:
      type: string
      example: "Home"
    address:
      type: string
    latitude:
      type: number
    longitude:
      type: number
    type:
      type: string
      enum: [HOME, WORK, OTHER]
    createdAt:
      type: string
      format: date-time
```

### `PromoCode` Schema
```yaml
PromoCode:
  type: object
  properties:
    id:
      type: integer
    code:
      type: string
      example: "SUMMER2026"
    discountType:
      type: string
      enum: [PERCENTAGE, FIXED]
    discountValue:
      type: number
      example: 20
    maxUses:
      type: integer
      nullable: true
    usedCount:
      type: integer
    isActive:
      type: boolean
    expiresAt:
      type: string
      format: date-time
      nullable: true
    createdAt:
      type: string
      format: date-time
```

---

## Summary

**Total Missing Endpoints: 40+**

### By Category:
- **Profile**: 7 endpoints
- **Drivers**: 5 endpoints  
- **Rides**: 7 endpoints
- **Payments**: 4 endpoints
- **Reviews**: 2 endpoints
- **Notifications**: 6 endpoints
- **Support**: 3 endpoints
- **Admin**: 15+ endpoints

### Priority:
1. **High Priority**: Notifications, Payments, Reviews (core features)
2. **Medium Priority**: Profile settings, Favorites, Support tickets
3. **Low Priority**: Admin stats endpoints (already have main stats)

---

## Next Steps

1. إضافة الـ schemas الجديدة في قسم `components/schemas`
2. إضافة كل الـ endpoints الناقصة مع التوثيق الكامل
3. تحديث الأمثلة والـ responses
4. إضافة error responses لكل endpoint
5. مراجعة الـ security requirements

