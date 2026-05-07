# Create Ride (Admin) - Examples

## Overview

Admin can manually create rides for clients. This is useful for:
- Creating rides on behalf of clients (phone orders)
- Testing purposes
- Emergency situations
- VIP bookings

## Features

- ✅ Create ride with or without driver assignment
- ✅ Automatic distance calculation
- ✅ Automatic fare calculation
- ✅ Support for STANDARD and CARPOOLING rides
- ✅ Real-time notifications via Socket.IO
- ✅ Validation of client and driver

## API Endpoint

```
POST /api/admin/rides/create
Authorization: Bearer <admin_token>
```

## Request Body

### Required Fields

```json
{
  "clientId": 5,
  "pickupLat": 24.7136,
  "pickupLng": 46.6753,
  "dropoffLat": 24.7736,
  "dropoffLng": 46.7353
}
```

### Optional Fields

```json
{
  "clientId": 5,
  "driverId": 3,                    // Optional: assign driver immediately
  "pickupLat": 24.7136,
  "pickupLng": 46.6753,
  "pickupAddress": "King Fahd Road, Riyadh",
  "dropoffLat": 24.7736,
  "dropoffLng": 46.7353,
  "dropoffAddress": "King Khalid International Airport",
  "type": "STANDARD",               // STANDARD or CARPOOLING
  "maxPassengers": 1,               // 1-4 (for CARPOOLING)
  "notes": "VIP client - handle with care"
}
```

## Examples

### 1. Create Ride Without Driver (Broadcast to All Drivers)

```bash
curl -X POST http://localhost:3000/api/admin/rides/create \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 5,
    "pickupLat": 24.7136,
    "pickupLng": 46.6753,
    "pickupAddress": "King Fahd Road, Riyadh",
    "dropoffLat": 24.7736,
    "dropoffLng": 46.7353,
    "dropoffAddress": "King Khalid International Airport",
    "type": "STANDARD"
  }'
```

**Response:**
```json
{
  "ride": {
    "id": 123,
    "clientId": 5,
    "driverId": null,
    "status": "REQUESTED",
    "type": "STANDARD",
    "pickupLat": 24.7136,
    "pickupLng": 46.6753,
    "pickupAddress": "King Fahd Road, Riyadh",
    "dropoffLat": 24.7736,
    "dropoffLng": 46.7353,
    "dropoffAddress": "King Khalid International Airport",
    "systemFare": 35.5,
    "fare": 35.5,
    "distance": 15.25,
    "duration": 23,
    "maxPassengers": 1,
    "availableSeats": 1,
    "requestedAt": "2026-05-07T10:30:00.000Z",
    "client": {
      "id": 5,
      "name": "Ahmed Ali",
      "email": "ahmed@example.com",
      "phone": "+966501234567"
    }
  },
  "message": "Ride created successfully"
}
```

**Notifications Sent:**
- ✅ All online drivers receive notification
- ✅ Client receives confirmation

---

### 2. Create Ride With Driver Assignment

```bash
curl -X POST http://localhost:3000/api/admin/rides/create \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 5,
    "driverId": 3,
    "pickupLat": 24.7136,
    "pickupLng": 46.6753,
    "pickupAddress": "King Fahd Road, Riyadh",
    "dropoffLat": 24.7736,
    "dropoffLng": 46.7353,
    "dropoffAddress": "King Khalid International Airport",
    "type": "STANDARD"
  }'
```

**Response:**
```json
{
  "ride": {
    "id": 124,
    "clientId": 5,
    "driverId": 3,
    "status": "ACCEPTED",
    "type": "STANDARD",
    "pickupLat": 24.7136,
    "pickupLng": 46.6753,
    "pickupAddress": "King Fahd Road, Riyadh",
    "dropoffLat": 24.7736,
    "dropoffLng": 46.7353,
    "dropoffAddress": "King Khalid International Airport",
    "systemFare": 35.5,
    "fare": 35.5,
    "distance": 15.25,
    "duration": 23,
    "maxPassengers": 1,
    "availableSeats": 1,
    "requestedAt": "2026-05-07T10:30:00.000Z",
    "acceptedAt": "2026-05-07T10:30:00.000Z",
    "client": {
      "id": 5,
      "name": "Ahmed Ali",
      "email": "ahmed@example.com",
      "phone": "+966501234567"
    },
    "driver": {
      "id": 3,
      "userId": 8,
      "carModel": "Toyota Camry 2022",
      "carPlate": "ABC-1234",
      "rating": 4.8,
      "user": {
        "id": 8,
        "name": "Mohammed Hassan",
        "phone": "+966509876543"
      }
    }
  },
  "message": "Ride created successfully"
}
```

**Notifications Sent:**
- ✅ Assigned driver receives notification
- ✅ Client receives confirmation
- ✅ Ride room receives update

---

### 3. Create Carpooling Ride

```bash
curl -X POST http://localhost:3000/api/admin/rides/create \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": 5,
    "pickupLat": 24.7136,
    "pickupLng": 46.6753,
    "pickupAddress": "King Fahd Road, Riyadh",
    "dropoffLat": 24.7736,
    "dropoffLng": 46.7353,
    "dropoffAddress": "King Khalid International Airport",
    "type": "CARPOOLING",
    "maxPassengers": 4
  }'
```

**Response:**
```json
{
  "ride": {
    "id": 125,
    "clientId": 5,
    "driverId": null,
    "status": "REQUESTED",
    "type": "CARPOOLING",
    "maxPassengers": 4,
    "availableSeats": 4,
    "systemFare": 35.5,
    "fare": 35.5,
    "distance": 15.25,
    "duration": 23,
    "pickupLat": 24.7136,
    "pickupLng": 46.6753,
    "pickupAddress": "King Fahd Road, Riyadh",
    "dropoffLat": 24.7736,
    "dropoffLng": 46.7353,
    "dropoffAddress": "King Khalid International Airport",
    "requestedAt": "2026-05-07T10:30:00.000Z",
    "client": {
      "id": 5,
      "name": "Ahmed Ali",
      "email": "ahmed@example.com",
      "phone": "+966501234567"
    }
  },
  "message": "Ride created successfully"
}
```

---

## Fare Calculation

The system automatically calculates the fare based on distance:

```
Base Fare: 5 SAR
Per KM: 2 SAR
Minimum Fare: 5 SAR

Formula: max(baseFare + (distance * perKm), minFare)

Example:
- Distance: 15.25 km
- Fare: 5 + (15.25 * 2) = 35.5 SAR
```

## Distance Calculation

Uses Haversine formula to calculate distance between two coordinates:

```typescript
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  // ... Haversine formula
  return distance in km
}
```

## Duration Estimation

Assumes average speed of 40 km/h:

```typescript
duration (minutes) = (distance / 40) * 60
```

## Validation

### Client Validation
- ✅ Client ID must exist
- ✅ Client must be a valid user

### Driver Validation (if provided)
- ✅ Driver ID must exist
- ✅ Driver must be approved (`isApproved: true`)

### Coordinates Validation
- ✅ Latitude: -90 to 90
- ✅ Longitude: -180 to 180

## Error Responses

### 400 Bad Request - Invalid Input
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "pickupLat",
      "message": "Invalid latitude"
    }
  ]
}
```

### 403 Forbidden - Not Admin
```json
{
  "error": "Admin access required"
}
```

### 404 Not Found - Client Not Found
```json
{
  "error": "Client not found"
}
```

### 404 Not Found - Driver Not Found
```json
{
  "error": "Driver not found"
}
```

### 400 Bad Request - Driver Not Approved
```json
{
  "error": "Driver is not approved"
}
```

## Socket.IO Events

### When Driver is NOT Assigned

**Event: `drivers` (broadcast to all drivers)**
```json
{
  "event": "ride:created",
  "data": {
    "ride": { ... }
  }
}
```

**Event: `user:{clientId}` (to client)**
```json
{
  "event": "ride:created",
  "data": {
    "ride": { ... }
  }
}
```

### When Driver IS Assigned

**Event: `user:{driverId}` (to driver)**
```json
{
  "event": "ride:assigned",
  "data": {
    "ride": { ... }
  }
}
```

**Event: `user:{clientId}` (to client)**
```json
{
  "event": "ride:accepted",
  "data": {
    "ride": { ... }
  }
}
```

**Event: `ride:{rideId}` (to ride room)**
```json
{
  "event": "ride:accepted",
  "data": {
    "ride": { ... }
  }
}
```

## Use Cases

### 1. Phone Order
Client calls support center, admin creates ride on their behalf.

### 2. VIP Booking
Admin creates ride and assigns specific trusted driver.

### 3. Emergency Ride
Quick ride creation with immediate driver assignment.

### 4. Testing
Create test rides for QA and development.

### 5. Scheduled Rides
Admin creates rides in advance for scheduled pickups.

## Best Practices

1. **Always verify client exists** before creating ride
2. **Check driver approval status** if assigning driver
3. **Provide addresses** for better user experience
4. **Use CARPOOLING** for cost-effective group rides
5. **Add notes** for special instructions
6. **Monitor notifications** to ensure delivery

## Integration Example

```typescript
import { createRideService } from "@/server/modules/admin";

// In your admin panel
async function createRideForClient(clientId: number, locations: any) {
  const payload = { userId: adminId, role: "ADMIN" };
  
  const result = await createRideService(payload, {
    clientId,
    pickupLat: locations.pickup.lat,
    pickupLng: locations.pickup.lng,
    pickupAddress: locations.pickup.address,
    dropoffLat: locations.dropoff.lat,
    dropoffLng: locations.dropoff.lng,
    dropoffAddress: locations.dropoff.address,
    type: "STANDARD",
  });
  
  return result.ride;
}
```
