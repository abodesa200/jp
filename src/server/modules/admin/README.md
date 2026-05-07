# Admin Module

Comprehensive admin management module for the ride-sharing platform.

## Overview

The admin module provides complete administrative control over:
- 👥 **Users Management**: Create, update, delete users
- 🚗 **Drivers Management**: Approve/reject drivers, manage driver info
- 🚕 **Rides Management**: View, update, assign drivers to rides
- 💰 **Payments Management**: Monitor and manage payments
- 🎟️ **Promo Codes Management**: Create and manage promotional codes
- 📊 **Statistics**: View platform statistics

## Structure

```
admin/
├── users/
│   ├── users.service.ts
│   ├── users.repository.ts
│   └── users.schema.ts
├── drivers/
│   ├── drivers.service.ts
│   ├── drivers.repository.ts
│   └── drivers.schema.ts
├── rides/
│   ├── rides.service.ts
│   ├── rides.repository.ts
│   └── rides.schema.ts
├── payments/
│   ├── payments.service.ts
│   ├── payments.repository.ts
│   └── payments.schema.ts
├── promo/
│   ├── promo.service.ts
│   ├── promo.repository.ts
│   └── promo.schema.ts
├── stats/
│   ├── stats.service.ts
│   └── stats.repository.ts
├── index.ts
└── README.md
```

## Permissions

| Module | ADMIN | CUSTOMER_SUPPORT |
|--------|-------|------------------|
| Users - View | ✅ | ✅ |
| Users - Create/Update/Delete | ✅ | ❌ |
| Drivers - View | ✅ | ✅ |
| Drivers - Approve/Update/Delete | ✅ | ❌ |
| Rides - View | ✅ | ✅ |
| Rides - Update/Delete/Assign | ✅ | ❌ |
| Payments - View | ✅ | ✅ |
| Payments - Update | ✅ | ❌ |
| Promo Codes - View | ✅ | ✅ |
| Promo Codes - Create/Update/Delete | ✅ | ❌ |
| Stats - View | ✅ | ✅ |

## API Endpoints

### Users Management

```
GET    /api/admin/users              # List users
GET    /api/admin/users/:id          # Get user by ID
POST   /api/admin/users              # Create user
PATCH  /api/admin/users/:id          # Update user
DELETE /api/admin/users/:id          # Delete user
```

### Drivers Management

```
GET    /api/admin/drivers            # List drivers
GET    /api/admin/drivers/pending    # List pending drivers
GET    /api/admin/drivers/:id        # Get driver by ID
PATCH  /api/admin/drivers/:id        # Update/approve driver
DELETE /api/admin/drivers/:id        # Delete driver
```

### Rides Management

```
GET    /api/admin/rides              # List rides
GET    /api/admin/rides/:id          # Get ride by ID
POST   /api/admin/rides/create       # Create ride (manual)
PATCH  /api/admin/rides/:id          # Update ride
DELETE /api/admin/rides/:id          # Delete ride
POST   /api/admin/rides/:id/assign   # Assign driver to ride
```

### Payments Management

```
GET    /api/admin/payments           # List payments
GET    /api/admin/payments/:id       # Get payment by ID
PATCH  /api/admin/payments/:id       # Update payment status
GET    /api/admin/payments/stats     # Payment statistics
```

### Promo Codes Management

```
GET    /api/admin/promo-codes        # List promo codes
GET    /api/admin/promo-codes/:id    # Get promo code by ID
POST   /api/admin/promo-codes        # Create promo code
PATCH  /api/admin/promo-codes/:id    # Update promo code
DELETE /api/admin/promo-codes/:id    # Delete promo code
GET    /api/admin/promo-codes/stats  # Promo code statistics
```

### Statistics

```
GET    /api/admin/stats              # Overall statistics
GET    /api/admin/stats/users        # User statistics
GET    /api/admin/stats/drivers      # Driver statistics
GET    /api/admin/stats/rides        # Ride statistics
GET    /api/admin/stats/revenue      # Revenue statistics
```

## Usage Examples

### Users Management

```typescript
import {
  getUsersService,
  createUserService,
  updateUserService,
  deleteUserService,
} from "@/server/modules/admin";

// Get users list
const users = await getUsersService(payload, {
  role: "CLIENT",
  page: 1,
  limit: 20,
  search: "ahmed",
});

// Create user
const newUser = await createUserService(payload, {
  email: "user@example.com",
  name: "Ahmed Ali",
  role: "CLIENT",
});

// Update user
const updated = await updateUserService(payload, userId, {
  name: "Ahmed Mohammed",
  isVerified: true,
});

// Delete user
await deleteUserService(payload, userId);
```

### Drivers Management

```typescript
import {
  getDriversService,
  updateDriverService,
  getPendingDriversService,
} from "@/server/modules/admin";

// Get all drivers
const drivers = await getDriversService(payload, {
  isApproved: "approved",
  isOnline: "online",
  page: 1,
  limit: 20,
});

// Get pending drivers (need approval)
const pending = await getPendingDriversService(payload);

// Approve driver
const approved = await updateDriverService(payload, driverId, {
  isApproved: true,
});
```

### Rides Management

```typescript
import {
  getRidesService,
  updateRideService,
  assignDriverService,
} from "@/server/modules/admin";

// Get rides with filters
const rides = await getRidesService(payload, {
  status: "COMPLETED",
  type: "STANDARD",
  page: 1,
  limit: 20,
  startDate: "2026-05-01T00:00:00Z",
  endDate: "2026-05-07T23:59:59Z",
});

// Update ride status
const updated = await updateRideService(payload, rideId, {
  status: "CANCELLED",
  cancelReason: "Driver unavailable",
});

// Assign driver to ride
const assigned = await assignDriverService(payload, rideId, {
  driverId: 5,
});
```

### Payments Management

```typescript
import {
  getPaymentsService,
  updatePaymentService,
  getPaymentStatsService,
} from "@/server/modules/admin";

// Get payments
const payments = await getPaymentsService(payload, {
  status: "PAID",
  method: "CARD",
  page: 1,
  limit: 20,
});

// Update payment status
const updated = await updatePaymentService(payload, paymentId, {
  status: "REFUNDED",
  transactionId: "txn_refund_123",
});

// Get payment statistics
const stats = await getPaymentStatsService(payload);
// Returns: { total, pending, paid, failed, refunded, totalRevenue }
```

### Promo Codes Management

```typescript
import {
  getPromoCodesService,
  createPromoCodeService,
  updatePromoCodeService,
} from "@/server/modules/admin";

// Get promo codes
const promoCodes = await getPromoCodesService(payload, {
  isActive: "active",
  page: 1,
  limit: 20,
});

// Create promo code
const newPromo = await createPromoCodeService(payload, {
  code: "SUMMER2026",
  discountType: "PERCENTAGE",
  discountValue: 20,
  expiresAt: "2026-08-31T23:59:59Z",
  maxUses: 100,
  isActive: true,
});

// Update promo code
const updated = await updatePromoCodeService(payload, promoId, {
  isActive: false,
});
```

## Query Parameters

### Common Pagination

All list endpoints support:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

### Users Filters

- `role`: Filter by role (CLIENT, DRIVER, ADMIN, CUSTOMER_SUPPORT)
- `search`: Search by name, email, or phone

### Drivers Filters

- `isApproved`: Filter by approval status (all, approved, pending)
- `isOnline`: Filter by online status (all, online, offline)
- `search`: Search by name, license number, or car plate

### Rides Filters

- `status`: Filter by status (all, REQUESTED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED)
- `type`: Filter by type (all, STANDARD, CARPOOLING)
- `search`: Search by client name, phone, or email
- `startDate`: Filter rides from this date (ISO 8601)
- `endDate`: Filter rides until this date (ISO 8601)

### Payments Filters

- `status`: Filter by status (all, PENDING, PAID, FAILED, REFUNDED)
- `method`: Filter by method (all, CASH, CARD, WALLET)
- `startDate`: Filter payments from this date (ISO 8601)
- `endDate`: Filter payments until this date (ISO 8601)

### Promo Codes Filters

- `isActive`: Filter by active status (all, active, inactive)
- `search`: Search by code

## Error Handling

All services throw standard HTTP errors:

```typescript
// 401 Unauthorized
throw new UnauthorizedError("Missing or invalid token");

// 403 Forbidden
throw new ForbiddenError("Admin access required");

// 404 Not Found
throw new NotFoundError("User not found");

// 409 Conflict
throw new ConflictError("Email already in use");
```

## Best Practices

1. **Always authenticate**: All admin endpoints require authentication
2. **Check permissions**: Verify user role before performing actions
3. **Validate input**: Use Zod schemas for input validation
4. **Use pagination**: Always paginate large result sets
5. **Log actions**: Log all admin actions for audit trail
6. **Handle errors**: Use proper error handling and return meaningful messages

## Security Considerations

- Admin endpoints should only be accessible to ADMIN and CUSTOMER_SUPPORT roles
- Sensitive operations (create, update, delete) should be ADMIN-only
- Always validate and sanitize user input
- Log all admin actions for security audit
- Use HTTPS in production
- Implement rate limiting for admin endpoints
- Consider adding 2FA for admin accounts

## Future Enhancements

- [ ] Add audit log for all admin actions
- [ ] Add bulk operations (bulk approve drivers, bulk update)
- [ ] Add export functionality (CSV, Excel)
- [ ] Add advanced filtering and sorting
- [ ] Add dashboard widgets
- [ ] Add real-time notifications for admin
- [ ] Add role-based access control (RBAC) with custom permissions
- [ ] Add activity timeline for entities
