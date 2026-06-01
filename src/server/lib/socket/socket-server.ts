import "dotenv/config";

import { ServiceType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  DRIVER_SERVICE_TYPES,
  getDriversRoomForServiceType,
  isCarpoolingRide,
  isServiceType,
} from "@/server/lib/socket/driver-rooms";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

const PORT = process.env.SOCKET_PORT || 3001;

const onlineDrivers = new Map<
  number,
  {
    socketId: string;
    lastSeen: number;
    serviceType: ServiceType;
  }
>();

const locationThrottle = new Map<string, number>();
const THROTTLE_MS = 2000;

function leaveAllCategoryRooms(socket: Socket) {
  for (const type of DRIVER_SERVICE_TYPES) {
    socket.leave(getDriversRoomForServiceType(type));
  }
}

async function syncDriverCategoryRoom(
  socket: Socket,
  userId: number,
  serviceType: ServiceType,
) {
  leaveAllCategoryRooms(socket);
  socket.join(getDriversRoomForServiceType(serviceType));

  const tracked = onlineDrivers.get(userId);

  if (tracked) {
    tracked.serviceType = serviceType;
    tracked.lastSeen = Date.now();
  } else {
    onlineDrivers.set(userId, {
      socketId: socket.id,
      lastSeen: Date.now(),
      serviceType,
    });
  }
}

async function resolveDriverServiceType(
  userId: number,
  authServiceType?: unknown,
): Promise<ServiceType> {
  if (isServiceType(authServiceType)) {
    return authServiceType;
  }

  try {
    const driver = await prisma.driver.findUnique({
      where: { userId },
      select: { serviceType: true },
    });

    if (!driver?.serviceType) {
      console.warn(`⚠️ Driver ${userId} has no serviceType, defaulting to STANDARD`);
      return "STANDARD";
    }

    return driver.serviceType;
  } catch (error) {
    console.error(`❌ Failed to resolve serviceType for driver ${userId}:`, error);
    return "STANDARD";
  }
}

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

        let targetRoom = room;

        if (event === "ride:created") {
          if (isCarpoolingRide(data?.ride ?? {})) {
            io.to("drivers").emit(event, data);
            console.log("📣 ride:created → drivers (CARPOOLING)");
            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ success: true, room: "drivers" }));
          }

          const rideServiceType = data?.ride?.serviceType;
          if (isServiceType(rideServiceType)) {
            targetRoom = getDriversRoomForServiceType(rideServiceType);
          } else if (room === "drivers") {
            console.warn("ride:created emitted to generic drivers room without serviceType");
            res.writeHead(400);
            return res.end(JSON.stringify({ error: "ride:created requires ride.serviceType" }));
          }
        }

        io.to(targetRoom).emit(event, data);

        if (event === "ride:created") {
          console.log(`📣 ride:created → ${targetRoom} (requested: ${room})`);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, room: targetRoom }));
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

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const { userId, role, serviceType: authServiceType } = socket.handshake.auth;

  if (!userId) {
    socket.disconnect();
    return;
  }

  const id = Number(userId);

  console.log(`✅ Connected: ${id} (${role})`);

  socket.join(`user:${id}`);

  if (role === "DRIVER") {
    socket.join("drivers");

    void resolveDriverServiceType(id, authServiceType)
      .then(async (serviceType) => {
        await syncDriverCategoryRoom(socket, id, serviceType);
        console.log(`🚗 Driver ${id} listening on ${getDriversRoomForServiceType(serviceType)}`);
      })
      .catch((error) => {
        console.error(`❌ Failed to resolve category for driver ${id}:`, error);
      });
  }

  socket.on("driver:heartbeat", () => {
    const driver = onlineDrivers.get(id);

    if (driver) {
      driver.lastSeen = Date.now();
    }

    if (role === "DRIVER") {
      void resolveDriverServiceType(id, authServiceType)
        .then((serviceType) => syncDriverCategoryRoom(socket, id, serviceType))
        .catch((error) => {
          console.error(`❌ Failed to refresh category for driver ${id}:`, error);
        });
    }
  });

  socket.on("ride:join", ({ rideId }) => {
    socket.join(`ride:${rideId}`);
  });

  socket.on("driver:location", async ({ rideId, lat, lng }) => {
    const key = `${id}:${rideId}`;
    const now = Date.now();

    if (now - (locationThrottle.get(key) || 0) < THROTTLE_MS) return;

    locationThrottle.set(key, now);

    prisma.driver
      .update({
        where: { userId: id },
        data: { latitude: lat, longitude: lng },
      })
      .catch(() => {});

    io.to(`ride:${rideId}`).emit("ride:location", {
      driverId: id,
      lat,
      lng,
      timestamp: now,
    });
  });

  socket.on("disconnect", () => {
    console.log(`❌ Disconnected: ${id}`);

    leaveAllCategoryRooms(socket);
    onlineDrivers.delete(id);

    for (const key of locationThrottle.keys()) {
      if (key.startsWith(`${id}:`)) {
        locationThrottle.delete(key);
      }
    }
  });
});

setInterval(() => {
  const now = Date.now();

  for (const [driverId, driver] of onlineDrivers.entries()) {
    if (now - driver.lastSeen > 30000) {
      onlineDrivers.delete(driverId);
    }
  }
}, 10000);

httpServer.listen(PORT, () => {
  console.log(`🔌 Socket server running on http://localhost:${PORT}`);
});
