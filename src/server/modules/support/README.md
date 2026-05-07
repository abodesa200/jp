# Support Module

Module for managing support tickets in the ride-sharing application.

## Features

- ✅ Create support tickets
- ✅ View user's own tickets
- ✅ View all tickets (Admin/Support staff)
- ✅ Update ticket status (resolve/reopen)
- ✅ Delete tickets (Admin only)
- ✅ Ticket statistics
- ✅ Pagination support
- ✅ Filter by status (all/open/resolved)

## Structure

```
support/
├── support.schema.ts      # Zod validation schemas
├── support.repository.ts  # Database operations
├── support.service.ts     # Business logic
├── index.ts              # Module exports
└── README.md             # Documentation
```

## API Endpoints

### User Endpoints

#### Create Ticket
```
POST /api/support/tickets
Authorization: Bearer <token>

Body:
{
  "subject": "Issue with ride payment",
  "message": "I was charged twice for the same ride..."
}
```

#### Get My Tickets
```
GET /api/support/tickets?status=open&page=1&limit=20
Authorization: Bearer <token>

Query Params:
- status: "all" | "open" | "resolved" (default: "all")
- page: number (default: 1)
- limit: number (default: 20, max: 100)
```

#### Get Ticket by ID
```
GET /api/support/tickets/:id
Authorization: Bearer <token>
```

### Admin/Support Endpoints

#### Get All Tickets
```
GET /api/admin/support/tickets?status=open&page=1&limit=20
Authorization: Bearer <admin_token>

Query Params:
- status: "all" | "open" | "resolved" (default: "all")
- page: number (default: 1)
- limit: number (default: 20, max: 100)
```

#### Update Ticket
```
PATCH /api/admin/support/tickets/:id
Authorization: Bearer <admin_token>

Body:
{
  "isResolved": true
}
```

#### Delete Ticket
```
DELETE /api/admin/support/tickets/:id
Authorization: Bearer <admin_token>
```

#### Get Ticket Stats
```
GET /api/admin/support/stats
Authorization: Bearer <admin_token>

Response:
{
  "stats": {
    "total": 150,
    "open": 45,
    "resolved": 105
  }
}
```

## Permissions

| Action | CLIENT | DRIVER | CUSTOMER_SUPPORT | ADMIN |
|--------|--------|--------|------------------|-------|
| Create ticket | ✅ | ✅ | ✅ | ✅ |
| View own tickets | ✅ | ✅ | ✅ | ✅ |
| View all tickets | ❌ | ❌ | ✅ | ✅ |
| Update ticket | ❌ | ❌ | ✅ | ✅ |
| Delete ticket | ❌ | ❌ | ❌ | ✅ |
| View stats | ❌ | ❌ | ✅ | ✅ |

## Usage Example

```typescript
import {
  createSupportTicketService,
  getUserTicketsService,
  getTicketByIdService,
} from "@/server/modules/support";

// In your route handler
const payload = { userId: 1, role: "CLIENT" };

// Create ticket
const result = await createSupportTicketService(payload, {
  subject: "Payment issue",
  message: "I was charged twice...",
});

// Get user's tickets
const tickets = await getUserTicketsService(payload, {
  status: "open",
  page: 1,
  limit: 20,
});

// Get specific ticket
const ticket = await getTicketByIdService(payload, 123);
```

## Database Schema

```prisma
model SupportTicket {
  id         Int      @id @default(autoincrement())
  userId     Int
  user       User     @relation(fields: [userId], references: [id])
  
  subject    String
  message    String
  isResolved Boolean  @default(false)
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## Future Enhancements

- [ ] Add ticket replies/comments
- [ ] Add file attachments
- [ ] Add ticket categories
- [ ] Add priority levels
- [ ] Add assignment to support staff
- [ ] Add email notifications
- [ ] Add ticket search
- [ ] Add ticket history/audit log
