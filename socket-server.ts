// Standalone Socket.IO Server - Simple & Production Ready
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "./src/lib/prisma.js";

const PORT = process.env.SOCKET_PORT || 3001;

// Simple in-memory throttle for driver location updates
const locationThrottle = new Map<string, number>();
const THROTTLE_MS = 2000; // 2 seconds

const httpServer = createServer((req, res) => {
  // HTTP endpoint for API routes to emit events
  if (req.method === "POST" && req.url === "/emit") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { room, event, data } = JSON.parse(body);
        if (room && event) {
          io.to(room).emit(event, data);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing room or event" }));
        }
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid request" }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const { userId, role } = socket.handshake.auth;

  if (!userId) {
    console.log("❌ Connection rejected: missing userId");
    socket.disconnect();
    return;
  }

  console.log(
    `✅ User ${userId} (${role}) connected - Socket ID: ${socket.id}`,
  );

  // Join user's personal room
  socket.join(`user:${userId}`);

  // Join drivers room if driver
  if (role === "DRIVER") {
    socket.join("drivers");
  }

  // ==================== RIDE EVENTS ====================

  // Client/Driver joins a ride room
  socket.on("ride:join", ({ rideId }) => {
    socket.join(`ride:${rideId}`);
    console.log(`📍 User ${userId} joined ride:${rideId}`);
  });

  // ==================== DRIVER LOCATION ====================

  socket.on("driver:location", async ({ rideId, lat, lng }) => {
    // Simple throttle check
    const throttleKey = `${userId}:${rideId}`;
    const lastUpdate = locationThrottle.get(throttleKey) || 0;
    const now = Date.now();

    if (now - lastUpdate < THROTTLE_MS) {
      return; // Skip this update
    }

    locationThrottle.set(throttleKey, now);

    try {
      // Update driver location in DB (async, don't wait)
      prisma.driver
        .update({
          where: { userId: parseInt(userId) },
          data: { latitude: lat, longitude: lng },
        })
        .catch((err) =>
          console.error("Failed to update driver location:", err),
        );

      // Broadcast to ride room immediately
      io.to(`ride:${rideId}`).emit("ride:location", {
        driverId: userId,
        lat,
        lng,
        timestamp: now,
      });
    } catch (error) {
      console.error("Error handling driver location:", error);
    }
  });

  // ==================== DRIVER STATUS ====================

  socket.on("driver:online", async () => {
    try {
      await prisma.driver.update({
        where: { userId: parseInt(userId) },
        data: { isOnline: true },
      });
      console.log(`🟢 Driver ${userId} is now online`);
    } catch (error) {
      console.error("Error setting driver online:", error);
    }
  });

  socket.on("driver:offline", async () => {
    try {
      await prisma.driver.update({
        where: { userId: parseInt(userId) },
        data: { isOnline: false },
      });
      console.log(`🔴 Driver ${userId} is now offline`);
    } catch (error) {
      console.error("Error setting driver offline:", error);
    }
  });

  // ==================== DISCONNECT ====================

  socket.on("disconnect", async () => {
    console.log(`👋 User ${userId} disconnected`);

    // Set driver offline on disconnect
    if (role === "DRIVER") {
      try {
        await prisma.driver.update({
          where: { userId: parseInt(userId) },
          data: { isOnline: false },
        });
      } catch (error) {
        console.error("Error setting driver offline on disconnect:", error);
      }
    }

    // Clean up throttle
    for (const key of locationThrottle.keys()) {
      if (key.startsWith(`${userId}:`)) {
        locationThrottle.delete(key);
      }
    }
  });
});

// Clean up old throttle entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of locationThrottle.entries()) {
    if (now - timestamp > 60000) {
      // 1 minute old
      locationThrottle.delete(key);
    }
  }
}, 60000);

httpServer.listen(PORT, () => {
  console.log(`🔌 Socket.IO server running on http://localhost:${PORT}`);
});
