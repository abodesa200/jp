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
- OTP-based authentication via email for both clients and drivers, with JWT issued on verification.
- Separate admin login with email and password (no OTP).
- Four user roles: `CLIENT`, `DRIVER`, `ADMIN`, `CUSTOMER_SUPPORT`.
- Soft-delete support on users and drivers.

**Client auth flow (register + login unified):**
1. Client sends their email to `POST /api/auth/send-otp`.
2. Client submits the received code to `POST /api/auth/verify-otp`.
3. If the email exists → login. If not → account is created automatically, then JWT is issued.
4. Optional `name` and `phone` can be passed at verify time for new accounts.

**Driver auth flow (admin-controlled):**
1. Driver accounts are created exclusively by admins from the admin panel — drivers cannot self-register.
2. Admin creates the driver account with vehicle and license details, and the account starts as `isApproved: false`.
3. Admin approves the driver via the pending-drivers workflow.
4. Once approved, the driver authenticates using the same OTP flow with `appContext: "driver"`.
5. Attempting OTP login with an unrecognized or unapproved driver email returns an explicit error.

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
Fares are computed server-side using a two-layer approach:

**Primary — ML Model (XGBoost):** The system calls a Python/Flask ML API (`/price`) with trip coordinates, distance, and time-of-day features. The model returns a base fare prediction, which is then multiplied by the service type and ride mode multipliers.

**Fallback — Rule-based:** If the ML API is unreachable (timeout or error), the system falls back to a deterministic formula:
- Base fare: 5 units
- Per-km rate: 2 units
- Service type multiplier (1× to 2.2×)
- Ride mode multiplier (CARPOOLING gets a 30% discount)
- Minimum fare floor: 5 units

**Trip Duration:** Estimated via a dedicated ML model (`/duration`) that uses coordinates, time features, and derived features (bearing, rush hour, speed). Falls back to a 40 km/h average speed calculation if the model is unavailable.

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

### Tip Suggestion
- After a ride is completed, the client can call `GET /api/rides/:id/tip-suggestion` to receive an ML-generated tip recommendation.
- The tip model (`/tips` endpoint on the Flask API) takes trip coordinates, distance, and departure time features as input.
- The suggested tip amount is returned alongside the final fare for context.
- The `Ride` model stores the actual tip in a `tip` field once the client confirms it.
- Falls back to `0` if the ML model is unavailable.

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

### ML Model API
- A Python/Flask server (`src/MODEL_API/`) runs alongside the Next.js app, exposing four endpoints:
  - `POST /price` — XGBoost fare prediction using trip coordinates and time features.
  - `POST /duration` — Trip duration prediction (seconds and minutes) using a separate model with derived features like bearing, rush hour flag, and cyclical time encodings.
  - `POST /tips` — Tip amount suggestion using a third XGBoost model trained on historical tip data.
  - `POST /predict` — Busy area classification using a Random Forest model (see below).
- All endpoints have graceful fallbacks in the Next.js layer — if the Flask server is down or times out (5s), the system uses rule-based calculations instead of failing the request.
- The Flask server URL is configurable via environment variables: `FARE_MODEL_URL`, `DURATION_MODEL_URL`, `TIPS_MODEL_URL`.

### Busy Area Classification (Admin)
- A Random Forest model classifies geographic areas by demand level (`low`, `medium`, `high`) based on location and time.
- The map is divided into a grid of 0.04-degree cells; each cell gets a unique ID used as a categorical feature (`area_encoded`).
- The model takes 7 features: `Lat`, `Lon`, `hour`, `day`, `month`, `weekday`, `area_encoded`.
- Exposed via `POST /predict` on the ML server; accessible only through the admin panel.
- Admins use this to identify high-demand zones and make informed decisions about driver distribution and operational focus.
- The endpoint returns the area ID, coordinates, time context, and the predicted `busy_class` for that cell.

---

## 4. Benefits and Advantages

**Unified codebase.** Next.js API routes and the frontend live in the same repository, reducing deployment complexity and keeping the team working in one place.

**Type-safe end to end.** Zod schemas validate all incoming requests and double as the source of truth for OpenAPI documentation, eliminating drift between docs and implementation.

**Flexible pricing model.** The fare engine handles multiple service tiers, ride modes, and discount stacking without requiring manual price entry from clients or drivers.

**Scalable role model.** The four-role system (CLIENT, DRIVER, ADMIN, CUSTOMER_SUPPORT) allows fine-grained access control that can grow with the business without restructuring the auth layer.

**Driver accountability.** Commission tracking, wallet history, and ride counts give the business full visibility into driver earnings and performance.

**Real-time capable.** The Socket.IO layer means ride events can be pushed instantly to drivers without polling, which is critical for a responsive dispatch experience.

**ML-powered pricing and tips.** Three XGBoost models handle fare prediction, trip duration estimation, and tip suggestions — all with automatic fallback to rule-based logic, so the platform stays functional even if the ML server is down.

**Demand intelligence for admins.** A Random Forest classification model analyzes geographic grid cells by time-of-day patterns to predict area busyness. This gives operations teams data-driven visibility into where demand is concentrated, enabling proactive driver positioning decisions.

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

### Scenario 7 — Client Gets a Tip Suggestion
1. Client completes a ride (status `COMPLETED`).
2. Client calls `GET /api/rides/:id/tip-suggestion`.
3. The system sends trip coordinates, distance, and departure time to the ML tips model.
4. The model returns a suggested tip amount based on historical patterns.
5. The suggested tip and the final fare are returned to the client for reference.

### Scenario 8 — Admin Monitors Busy Areas
1. Admin opens the busy area panel in the admin dashboard.
2. The panel sends a request with the current coordinates and time (hour, day, month, weekday) to `POST /predict` on the ML server.
3. The model maps the coordinates to a 0.04-degree grid cell and returns a `busy_class` (`low`, `medium`, or `high`).
4. The admin sees a demand heatmap and can identify zones that need more driver coverage.
5. Admin can act by sending targeted notifications to nearby offline drivers or adjusting surge pricing for high-demand cells.

---

## 6. System Value

This platform delivers a production-ready foundation for a ride-hailing business. It removes the need to build core infrastructure from scratch — authentication, pricing, dispatch, payments, and administration are all implemented and integrated.

The combination of a flexible ride model (three service tiers, two ride modes, two pricing flows) means the platform can serve diverse market segments — budget commuters, premium travelers, and group transport — without separate codebases.

The admin panel gives operations teams direct control over the driver supply side (approvals, suspensions, manual assignments) and the commercial side (promo codes, payment oversight, revenue stats), making it viable as a standalone operations tool from day one.

Real-time socket integration and GPS-based driver/ride matching lay the groundwork for a responsive mobile or web client experience, while the OpenAPI documentation ensures any frontend or third-party integration team can work against a stable, self-describing API contract.
