# 🧪 Test Pages Setup - Complete Guide

## 📦 What's Included

This setup includes comprehensive test pages for the ride system with the following features:

### 🎯 Test Pages Created:
1. **Client Test Page** (`/test-client`) - Full client interface
2. **Driver Test Page** (`/test-driver`) - Full driver interface

### 🛠️ Scripts Added:
- `pnpm create-test-users` - Creates test users (client + 2 drivers)
- `pnpm test:auth:interactive` - Interactive JWT token generator

### 📚 Documentation Files:
- `TEST_PAGES_README.md` - Complete English documentation
- `QUICK_START_AR.md` - Quick start guide in Arabic
- `test-ride-flow.http` - REST Client test file
- `TEST_SETUP.md` - This file

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Add Google Maps API Key

1. Get your API key from: https://console.cloud.google.com/google/maps-apis
2. Enable these APIs:
   - Maps JavaScript API
   - Directions API
3. Add to `.env`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Step 3: Create Test Users
```bash
pnpm create-test-users
```

This creates:
- ✅ Client: `+963911111111`
- ✅ Driver 1: `+963922222222`
- ✅ Driver 2: `+963933333333`

### Step 4: Start the Project
```bash
pnpm dev
```

This starts:
- Next.js on `http://localhost:3000`
- Socket.IO on `http://localhost:3001`

### Step 5: Get JWT Tokens
```bash
pnpm test:auth:interactive
```

Follow the prompts to get tokens for client and driver.

### Step 6: Open Test Pages

**Client Page:**
- URL: `http://localhost:3000/test-client`
- Paste client JWT token
- Enter client user ID

**Driver Page:**
- URL: `http://localhost:3000/test-driver`
- Paste driver JWT token
- Enter driver user ID

---

## 🎯 Features Available

### Client Page Features:
- ✅ Create new rides
- ✅ Select locations on map
- ✅ View all rides
- ✅ Start price negotiation
- ✅ Track driver location in real-time
- ✅ Cancel rides
- ✅ Real-time notifications
- ✅ Support for Standard & Carpooling rides

### Driver Page Features:
- ✅ View nearby rides
- ✅ Accept rides
- ✅ Update ride status
- ✅ Respond to negotiations
- ✅ Broadcast location to client
- ✅ View route on map
- ✅ Cancel rides
- ✅ Real-time notifications
- ✅ Online/Offline toggle

---

## 🧪 Test Scenarios

### Scenario 1: Complete Ride Flow

1. **Client:** Create a ride
2. **Driver:** Accept the ride
3. **Driver:** Click "I've Arrived"
4. **Driver:** Click "Start Ride"
5. **Client:** Watch driver location update
6. **Driver:** Click "Complete Ride"

### Scenario 2: Price Negotiation

1. **Client:** Create a ride
2. **Client:** Send a lower offer (e.g., $6.0)
3. **Driver:** Accept ride
4. **Driver:** Send counter offer (e.g., $7.0)
5. **Client:** Accept or reject

### Scenario 3: Carpooling

1. **Client:** Select "Carpooling" type
2. **Client:** Set max passengers (2-4)
3. **Client:** Create ride
4. **Driver:** Accept and view available seats

### Scenario 4: Ride Cancellation

1. **Client or Driver:** Click "Cancel"
2. **Other party:** Receives notification

---

## 🔧 Troubleshooting

### Map not showing?
- ✅ Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env`
- ✅ Restart the server
- ✅ Check browser console for errors

### Socket not connected?
- ✅ Make sure `pnpm dev` is running (not just `pnpm dev:next`)
- ✅ Check port 3001 is available
- ✅ Enter correct User ID

### "Unauthorized" errors?
- ✅ Check JWT token is valid
- ✅ Verify user role (CLIENT or DRIVER)
- ✅ Get a new token

### Driver location not showing?
- ✅ Enable "Online" in driver page
- ✅ Allow browser location access
- ✅ Ride must be in `IN_PROGRESS` status

---

## 📱 Test Users

| Role | Phone | Usage |
|------|-------|-------|
| Client | +963911111111 | Client test page |
| Driver 1 | +963922222222 | Driver test page |
| Driver 2 | +963933333333 | Multi-driver testing |

---

## 🎨 Technology Stack

- **Frontend:** Next.js 16.2.3, React 19.2.4
- **Maps:** @react-google-maps/api 2.20.8
- **Real-time:** Socket.IO 4.8.3
- **Styling:** Tailwind CSS 4
- **Database:** Prisma + PostgreSQL

---

## 📚 Additional Resources

- **API Documentation:** `RIDES_DOCUMENTATION.md`
- **Detailed Guide:** `TEST_PAGES_README.md`
- **Quick Start (Arabic):** `QUICK_START_AR.md`
- **REST Client Tests:** `test-ride-flow.http`

---

## 🎯 Next Steps

After testing, you can:

1. **Customize the UI:**
   - Edit `src/app/test-client/page.tsx`
   - Edit `src/app/test-driver/page.tsx`

2. **Add More Features:**
   - Payment integration
   - Rating system
   - Chat between client and driver
   - Push notifications

3. **Deploy:**
   - Add production Google Maps API key
   - Configure Socket.IO for production
   - Set up environment variables

---

## ✅ Checklist

Before testing:
- [ ] Dependencies installed
- [ ] Google Maps API key added
- [ ] Test users created
- [ ] Project running
- [ ] JWT tokens obtained
- [ ] Test pages opened

---

## 🤝 Support

If you encounter issues:
1. Check browser console
2. Check server logs
3. Verify Socket.IO is running
4. Ensure JWT token is valid

---

**Happy Testing! 🚀**

For detailed documentation, see `TEST_PAGES_README.md`
