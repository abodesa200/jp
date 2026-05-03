# 🚀 START HERE - Quick Test Guide

## ⚡ 3-Minute Setup

### Step 1: Install & Setup (1 min)
```bash
pnpm install
pnpm create-test-users
```

### Step 2: Add Google Maps Key (30 sec)
Edit `.env` and add:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```
Get key from: https://console.cloud.google.com/google/maps-apis

### Step 3: Start Project (30 sec)
```bash
pnpm dev
```

### Step 4: Get Tokens (1 min)
```bash
pnpm test:auth:interactive
```
Copy the JWT tokens.

---

## 🧪 Test Now!

### Client Page
1. Open: http://localhost:3000/test-client
2. Paste JWT token
3. Enter User ID
4. Click on map twice (pickup → dropoff)
5. Click "Create Ride"

### Driver Page
1. Open: http://localhost:3000/test-driver
2. Paste JWT token
3. Enter User ID
4. Enable "Online"
5. Click "Accept" on ride
6. Click "I've Arrived" → "Start Ride" → "Complete Ride"

---

## 📱 Test Users

After running `pnpm create-test-users`:
- Client: `+963911111111`
- Driver: `+963922222222`

---

## 📚 Full Documentation

- **Arabic Quick Start:** `QUICK_START_AR.md`
- **English Setup:** `TEST_SETUP.md`
- **Complete Guide:** `TEST_PAGES_README.md`
- **Final Summary:** `FINAL_SUMMARY.md`

---

## ✅ What You Can Test

- ✅ Create rides
- ✅ Accept rides
- ✅ Track driver location
- ✅ Negotiate prices
- ✅ Real-time updates
- ✅ Cancel rides
- ✅ Carpooling

---

## 🔧 Troubleshooting

**Map not showing?**
→ Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env` and restart

**Socket not connected?**
→ Make sure `pnpm dev` is running (not just `pnpm dev:next`)

**Unauthorized errors?**
→ Get new token with `pnpm test:auth:interactive`

---

**🎉 That's it! Start testing now!**

For detailed help, see `QUICK_START_AR.md` (Arabic) or `TEST_SETUP.md` (English)
