# Support Module - Integration Examples

## User Flow Examples

### 1. Create a Support Ticket

```bash
# User creates a ticket
curl -X POST http://localhost:3000/api/support/tickets \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Payment issue with ride #123",
    "message": "I was charged twice for the same ride. The first charge was 50 SAR and the second was 50 SAR as well. Please help me get a refund."
  }'

# Response:
{
  "ticket": {
    "id": 1,
    "userId": 5,
    "subject": "Payment issue with ride #123",
    "message": "I was charged twice...",
    "isResolved": false,
    "createdAt": "2026-05-07T10:30:00.000Z",
    "updatedAt": "2026-05-07T10:30:00.000Z",
    "user": {
      "id": 5,
      "name": "Ahmed Ali",
      "email": "ahmed@example.com",
      "phone": "+966501234567"
    }
  },
  "message": "Support ticket created successfully"
}
```

### 2. View My Tickets

```bash
# Get all my tickets
curl -X GET "http://localhost:3000/api/support/tickets?status=all&page=1&limit=20" \
  -H "Authorization: Bearer <user_token>"

# Get only open tickets
curl -X GET "http://localhost:3000/api/support/tickets?status=open" \
  -H "Authorization: Bearer <user_token>"

# Get only resolved tickets
curl -X GET "http://localhost:3000/api/support/tickets?status=resolved" \
  -H "Authorization: Bearer <user_token>"

# Response:
{
  "tickets": [
    {
      "id": 1,
      "userId": 5,
      "subject": "Payment issue with ride #123",
      "message": "I was charged twice...",
      "isResolved": false,
      "createdAt": "2026-05-07T10:30:00.000Z",
      "updatedAt": "2026-05-07T10:30:00.000Z",
      "user": {
        "id": 5,
        "name": "Ahmed Ali",
        "email": "ahmed@example.com",
        "phone": "+966501234567"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### 3. View Specific Ticket

```bash
# Get ticket by ID
curl -X GET http://localhost:3000/api/support/tickets/1 \
  -H "Authorization: Bearer <user_token>"

# Response:
{
  "ticket": {
    "id": 1,
    "userId": 5,
    "subject": "Payment issue with ride #123",
    "message": "I was charged twice...",
    "isResolved": false,
    "createdAt": "2026-05-07T10:30:00.000Z",
    "updatedAt": "2026-05-07T10:30:00.000Z",
    "user": {
      "id": 5,
      "name": "Ahmed Ali",
      "email": "ahmed@example.com",
      "phone": "+966501234567",
      "role": "CLIENT"
    }
  }
}
```

## Admin/Support Staff Flow

### 1. View All Tickets

```bash
# Get all tickets
curl -X GET "http://localhost:3000/api/admin/support/tickets?status=all&page=1&limit=20" \
  -H "Authorization: Bearer <admin_token>"

# Get only open tickets
curl -X GET "http://localhost:3000/api/admin/support/tickets?status=open" \
  -H "Authorization: Bearer <admin_token>"

# Response:
{
  "tickets": [
    {
      "id": 1,
      "userId": 5,
      "subject": "Payment issue with ride #123",
      "message": "I was charged twice...",
      "isResolved": false,
      "createdAt": "2026-05-07T10:30:00.000Z",
      "updatedAt": "2026-05-07T10:30:00.000Z",
      "user": {
        "id": 5,
        "name": "Ahmed Ali",
        "email": "ahmed@example.com",
        "phone": "+966501234567",
        "role": "CLIENT"
      }
    },
    {
      "id": 2,
      "userId": 8,
      "subject": "Driver was rude",
      "message": "The driver was very rude...",
      "isResolved": false,
      "createdAt": "2026-05-07T11:00:00.000Z",
      "updatedAt": "2026-05-07T11:00:00.000Z",
      "user": {
        "id": 8,
        "name": "Sara Mohammed",
        "email": "sara@example.com",
        "phone": "+966509876543",
        "role": "CLIENT"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

### 2. Resolve a Ticket

```bash
# Mark ticket as resolved
curl -X PATCH http://localhost:3000/api/admin/support/tickets/1 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "isResolved": true
  }'

# Response:
{
  "ticket": {
    "id": 1,
    "userId": 5,
    "subject": "Payment issue with ride #123",
    "message": "I was charged twice...",
    "isResolved": true,
    "createdAt": "2026-05-07T10:30:00.000Z",
    "updatedAt": "2026-05-07T12:00:00.000Z",
    "user": {
      "id": 5,
      "name": "Ahmed Ali",
      "email": "ahmed@example.com",
      "phone": "+966501234567",
      "role": "CLIENT"
    }
  },
  "message": "Ticket updated successfully"
}
```

### 3. Reopen a Ticket

```bash
# Mark ticket as unresolved (reopen)
curl -X PATCH http://localhost:3000/api/admin/support/tickets/1 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "isResolved": false
  }'
```

### 4. Delete a Ticket (Admin only)

```bash
# Delete ticket
curl -X DELETE http://localhost:3000/api/admin/support/tickets/1 \
  -H "Authorization: Bearer <admin_token>"

# Response:
{
  "message": "Ticket deleted successfully"
}
```

### 5. View Ticket Statistics

```bash
# Get ticket stats
curl -X GET http://localhost:3000/api/admin/support/stats \
  -H "Authorization: Bearer <admin_token>"

# Response:
{
  "stats": {
    "total": 150,
    "open": 45,
    "resolved": 105
  }
}
```

## TypeScript Integration

### In a React Component

```typescript
"use client";

import { useState, useEffect } from "react";

interface Ticket {
  id: number;
  subject: string;
  message: string;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/support/tickets?status=all", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setTickets(data.tickets);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (subject: string, message: string) => {
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ subject, message }),
      });

      if (res.ok) {
        fetchTickets(); // Refresh list
      }
    } catch (error) {
      console.error("Failed to create ticket:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Support Tickets</h1>
      {tickets.map((ticket) => (
        <div key={ticket.id}>
          <h3>{ticket.subject}</h3>
          <p>{ticket.message}</p>
          <span>{ticket.isResolved ? "✅ Resolved" : "⏳ Open"}</span>
        </div>
      ))}
    </div>
  );
}
```

### In a Server Action

```typescript
"use server";

import {
  createSupportTicketService,
  getUserTicketsService,
} from "@/server/modules/support";
import { authenticate } from "@/server/lib/auth/auth";
import { cookies } from "next/headers";

export async function createTicketAction(formData: FormData) {
  const token = (await cookies()).get("token")?.value;
  if (!token) throw new Error("Unauthorized");

  // You'll need to decode the token to get the payload
  const payload = { userId: 1, role: "CLIENT" as const };

  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  return await createSupportTicketService(payload, { subject, message });
}

export async function getMyTicketsAction() {
  const token = (await cookies()).get("token")?.value;
  if (!token) throw new Error("Unauthorized");

  const payload = { userId: 1, role: "CLIENT" as const };

  return await getUserTicketsService(payload, {
    status: "all",
    page: 1,
    limit: 20,
  });
}
```

## Error Handling

### Common Errors

```typescript
// 400 Bad Request - Invalid input
{
  "error": "Validation failed",
  "details": [
    {
      "field": "subject",
      "message": "Subject must be at least 5 characters"
    }
  ]
}

// 401 Unauthorized - No token or invalid token
{
  "error": "Unauthorized"
}

// 403 Forbidden - Insufficient permissions
{
  "error": "Only admins and support staff can view all tickets"
}

// 404 Not Found - Ticket doesn't exist
{
  "error": "Ticket not found"
}
```

## Testing with Postman/Thunder Client

### 1. Setup Environment Variables

```
BASE_URL=http://localhost:3000
USER_TOKEN=<your_user_jwt_token>
ADMIN_TOKEN=<your_admin_jwt_token>
```

### 2. Test Collection

1. **Create Ticket** - POST `{{BASE_URL}}/api/support/tickets`
2. **Get My Tickets** - GET `{{BASE_URL}}/api/support/tickets`
3. **Get Ticket by ID** - GET `{{BASE_URL}}/api/support/tickets/1`
4. **Get All Tickets (Admin)** - GET `{{BASE_URL}}/api/admin/support/tickets`
5. **Update Ticket (Admin)** - PATCH `{{BASE_URL}}/api/admin/support/tickets/1`
6. **Delete Ticket (Admin)** - DELETE `{{BASE_URL}}/api/admin/support/tickets/1`
7. **Get Stats (Admin)** - GET `{{BASE_URL}}/api/admin/support/stats`

## Integration with Notifications

You can integrate the support module with the notifications module to notify users when their ticket status changes:

```typescript
import { createNotificationService } from "@/server/modules/notifications";

// After resolving a ticket
await createNotificationService(
  { userId: adminId, role: "ADMIN" },
  {
    userId: ticket.userId,
    title: "Ticket Resolved",
    message: `Your support ticket "${ticket.subject}" has been resolved.`,
  }
);
```
