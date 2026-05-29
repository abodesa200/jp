# Project Report — Junior Ride-Hailing Platform

---

## 1. Project Overview

This project is a full-stack ride-hailing backend platform built with **Next.js 16**, **PostgreSQL** (via Prisma ORM), and **Socket.IO**. It provides the complete server-side infrastructure for a transportation service similar in concept to Uber or Careem, covering everything from user authentication to ride lifecycle management, payments, and an admin control panel.

The system is designed to serve three distinct user types: **clients** (passengers), **drivers**, and **administrators**, each with their own dedicated API surface and access controls.

---

## 2. Core Functionality

The platform manages the full lifecycle of a ride — from the moment a client requests one, through driver matching and acceptance, real-time tracking, payment collection, and post-ride review. It also handles the business layer around that lifecycle: pricing calculation, discount/coupon application, driver wallet management, and commission tracking.

Authentication is OTP-based (via email or phone), with JWT tokens issued on verification. Admins authenticate separately using email and password.

---

## 3. Key Features

### Authentication & User Management
- OTP-based login via email or phone number, with JWT issued as an HttpOnly cookie.
- Separate admin login with password-based authentication.
- Four user roles: `CLIENT`, `DRIVER`, `ADMIN`, `CUSTOMER_SUPPORT`.
- Soft-delete support on users and drivers.

### Ride Modes & Service Types
The platform supports a flexible ride configuration matrix:

| Service Type | Description | Carpooling | Max Passengers | Fare Multiplier |
|---|---|---|---|---|
| STANDARD | Regular car | ✅ | 4 | 1× |
| VIP | Luxury car | ❌ | 4 | 2.2× |
| VAN | Van/minibus | ✅ | 8 | 1.6× |

Rides also have two flow types:
- **NORMAL** — fixed system-calculated fare.
- **NEGOTIATION** — client submits an offer, driver can counter-offer; both parties accept/reject.

### Fare Calculation
Fares are computed server-side using the Haversine formula for distance, then applying:
- Base fare: 5 units
- Per-km rate: 2 units
- Service type multiplier (1× to 2.2×)
- Ride mode multiplier (CARPOOLING gets a 30% discount)
- Minimum fare floor: 5 units

Estimated trip duration is also calculated based on an assumed average speed of 40 km/h.

### Carpooling
Clients can join existing CARPOOLING rides, each with their own pickup/dropoff coordinates and individual fare. The ride tracks available seats and a passenger roster (`RidePassenger`). Carpooling is not available for VIP service.

### Coupon & Promo Code System
- Supports percentage-based and fixed-amount discounts.
- Configurable constraints: minimum fare, maximum discount cap, usage limits per user and globally, validity window (start/expiry dates), and new-users-only flag.
- Coupon usage is recorded per ride to prevent reuse.

### Driver Management
- Drivers register and go through an admin approval flow before they can accept rides.
- Real-time status tracking: `OFFLINE`, `ONLINE`, `ON_TRIP`, `SUSPENDED`.
- GPS location updates stored with a timestamp (`lastLocationUpdate`).
- Nearby ride discovery: drivers query available rides filtered by distance from their current location.

### Driver Wallet & Commission
- Each driver has a wallet tracking balance, total earned, and total deducted.
- Configurable commission rate per driver (default 20%).
- Full transaction history with types: `COMMISSION`, `PAYOUT`, `ADJUSTMENT`.

### Payment System
- Supports `CASH`, `CARD`, and `WALLET` payment methods.
- Payment status lifecycle: `PENDING` → `PAID` / `FAILED` / `REFUNDED`.
- Tracks whether payment was collected by the driver and when.

### Real-Time Events
- Socket.IO integration for pushing live events to drivers (e.g., `ride:created`).
- The socket server runs as a separate process alongside the Next.js app.

### Notifications
- Per-user notification records with read/unread state.
- Admin can broadcast notifications to individual users or groups.
- Endpoints for marking read, deleting, and fetching unread count.

### Reviews
- Clients submit a rating (1–5) and optional comment after a completed ride.
- Reviews are linked to the ride, client, and driver.
- Driver's aggregate rating and total ride count are maintained on the `Driver` model.

### Favorite Locations
- Clients can save named locations (e.g., "Home", "Work") with coordinates for quick reuse.

### Support Tickets
- Clients submit support tickets with a subject and message.
- Admins can view all tickets, filter by status, and close them.

### Admin Dashboard
- Full CRUD over users, drivers, rides, payments, and promo codes.
- Statistics endpoints for users, drivers, rides, and revenue.
- Manual ride creation and manual driver assignment to rides.
- Driver approval/rejection workflow.

### API Documentation
- OpenAPI spec auto-generated from Zod schemas using `@asteasolutions/zod-to-openapi`.
- Swagger UI served at `/docs` within the app.

---

## 4. Benefits and Advantages

**Unified codebase.** Next.js API routes and the frontend live in the same repository, reducing deployment complexity and keeping the team working in one place.

**Type-safe end to end.** Zod schemas validate all incoming requests and double as the source of truth for OpenAPI documentation, eliminating drift between docs and implementation.

**Flexible pricing model.** The fare engine handles multiple service tiers, ride modes, and discount stacking without requiring manual price entry from clients or drivers.

**Scalable role model.** The four-role system (CLIENT, DRIVER, ADMIN, CUSTOMER_SUPPORT) allows fine-grained access control that can grow with the business without restructuring the auth layer.

**Driver accountability.** Commission tracking, wallet history, and ride counts give the business full visibility into driver earnings and performance.

**Real-time capable.** The Socket.IO layer means ride events can be pushed instantly to drivers without polling, which is critical for a responsive dispatch experience.

---

## 5. User Scenarios

### Scenario 1 — Client Books a Standard Ride
1. Client sends OTP to their email, verifies it, and receives a JWT.
2. Client calls `POST /api/rides` with pickup/dropoff coordinates, `serviceType: STANDARD`, `rideMode: PRIVATE`.
3. The system calculates distance (Haversine), computes the fare, and creates the ride with status `REQUESTED`.
4. Nearby online drivers receive a `ride:created` socket event.
5. A driver accepts via `POST /api/rides/:id/accept`. Status moves to `ACCEPTED`.
6. Driver marks arrival (`DRIVER_ARRIVED`), starts the trip (`IN_PROGRESS`), then completes it (`COMPLETED`).
7. Client submits a review and the payment is recorded.

### Scenario 2 — Client Uses a Promo Code
1. Client includes `couponCode: "SUMMER25"` in the ride creation request.
2. The service validates the coupon (active, not expired, fare meets minimum).
3. Discount is calculated and subtracted from the system fare.
4. `finalFare` reflects the discounted amount; coupon usage is recorded to prevent reuse.

### Scenario 3 — Price Negotiation
1. Client creates a ride with `rideFlow: NEGOTIATION` and `clientOffer: 12.5`.
2. A driver sees the ride and submits a counter-offer via `POST /api/rides/:id/negotiate`.
3. Client reviews the counter-offer and accepts via `PATCH /api/rides/:id/negotiate` with `action: accept`.
4. The `negotiatedFare` is locked in and the ride proceeds normally.

### Scenario 4 — Carpooling
1. A driver creates a CARPOOLING ride with `serviceType: STANDARD` and `maxPassengers: 3`.
2. Multiple clients search `GET /api/rides/carpooling/available` with their coordinates.
3. Each client joins via `POST /api/rides/:id/join`, providing their own pickup/dropoff.
4. Each passenger is assigned an individual fare. The ride departs when the driver starts it.

### Scenario 5 — Admin Approves a New Driver
1. Driver registers, submits license and vehicle details.
2. Admin sees the driver in `GET /api/admin/drivers/pending`.
3. Admin calls `PATCH /api/admin/drivers/:id` with `{ "isApproved": true }`.
4. Driver can now go online and start accepting rides.

### Scenario 6 — Admin Runs a Promotion Campaign
1. Admin creates a coupon via `POST /api/admin/promo-codes` with a 25% discount, 100-use limit, and expiry date.
2. Admin sends a notification to all users via `POST /api/admin/notifications/send`.
3. Clients apply the code on their next ride; usage is tracked and capped automatically.

---

## 6. System Value

This platform delivers a production-ready foundation for a ride-hailing business. It removes the need to build core infrastructure from scratch — authentication, pricing, dispatch, payments, and administration are all implemented and integrated.

The combination of a flexible ride model (three service tiers, two ride modes, two pricing flows) means the platform can serve diverse market segments — budget commuters, premium travelers, and group transport — without separate codebases.

The admin panel gives operations teams direct control over the driver supply side (approvals, suspensions, manual assignments) and the commercial side (promo codes, payment oversight, revenue stats), making it viable as a standalone operations tool from day one.

Real-time socket integration and GPS-based driver/ride matching lay the groundwork for a responsive mobile or web client experience, while the OpenAPI documentation ensures any frontend or third-party integration team can work against a stable, self-describing API contract.
