// Standalone Socket.IO Server - Clean Architecture
import { prisma } from "@/lib/prisma";
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = process.env.SOCKET_PORT || 3001;

// =======================
// ONLINE DRIVERS MEMORY
// =======================
const onlineDrivers = new Map<
  number,
  {
    socketId: string;
    lastSeen: number;
  }
>();

// =======================
// LOCATION THROTTLE
// =======================
const locationThrottle = new Map<string, number>();
const THROTTLE_MS = 2000;

// =======================
// HTTP EMIT BRIDGE
// =======================
const httpServer = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/emit") {
    let body = "";

    req.on("data", (chunk) => (body += chunk.toString()));

    req.on("end", () => {
      try {
        const { room, event, data } = JSON.parse(body);

        if (!room || !event) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: "Missing room or event" }));
        }

        io.to(room).emit(event, data);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch {
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Invalid request" }));
      }
    });

    return;
  }

  res.writeHead(404);
  res.end();
});

// =======================
// SOCKET SERVER
// =======================
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
  },
});

// =======================
// CONNECTION
// =======================
io.on("connection", (socket) => {
  const { userId, role } = socket.handshake.auth;

  if (!userId) {
    socket.disconnect();
    return;
  }

  const id = Number(userId);

  console.log(`✅ Connected: ${id} (${role})`);

  socket.join(`user:${id}`);

  // =======================
  // DRIVER ONLINE REGISTER
  // =======================
  if (role === "DRIVER") {
    onlineDrivers.set(id, {
      socketId: socket.id,
      lastSeen: Date.now(),
    });

    socket.join("drivers");
  }

  // =======================
  // HEARTBEAT
  // =======================
  socket.on("driver:heartbeat", () => {
    const driver = onlineDrivers.get(id);

    if (driver) {
      driver.lastSeen = Date.now();
    }
  });

  // =======================
  // RIDE ROOM
  // =======================
  socket.on("ride:join", ({ rideId }) => {
    socket.join(`ride:${rideId}`);
  });

  // =======================
  // DRIVER LOCATION
  // =======================
  socket.on("driver:location", async ({ rideId, lat, lng }) => {
    const key = `${id}:${rideId}`;
    const now = Date.now();

    if (now - (locationThrottle.get(key) || 0) < THROTTLE_MS) return;

    locationThrottle.set(key, now);

    // DB update (optional, async)
    prisma.driver
      .update({
        where: { userId: id },
        data: { latitude: lat, longitude: lng },
      })
      .catch(() => { });

    io.to(`ride:${rideId}`).emit("ride:location", {
      driverId: id,
      lat,
      lng,
      timestamp: now,
    });
  });

  // =======================
  // DISCONNECT
  // =======================
  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${id}`);

    onlineDrivers.delete(id);

    for (const key of locationThrottle.keys()) {
      if (key.startsWith(`${id}:`)) {
        locationThrottle.delete(key);
      }
    }
  });
});

// =======================
// CLEANUP OFFLINE DRIVERS
// =======================
setInterval(() => {
  const now = Date.now();

  for (const [id, driver] of onlineDrivers.entries()) {
    if (now - driver.lastSeen > 30000) {
      onlineDrivers.delete(id);
    }
  }
}, 10000);

// =======================
// START SERVER
// =======================
httpServer.listen(PORT, () => {
  console.log(`🔌 Socket server running on http://localhost:${PORT}`);
});