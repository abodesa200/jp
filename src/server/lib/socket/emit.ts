import { resolveRideCreatedRoom, DRIVER_SERVICE_TYPES, getDriversRoomForServiceType, isCarpoolingRide } from "./driver-rooms";

type EmitOptions = {
  skipRoomResolve?: boolean;
};

// Simple helper to emit socket events from API routes
export async function emitSocketEvent(
  room: string,
  event: string,
  data: any,
  options?: EmitOptions,
): Promise<boolean> {
  try {
    const targetRoom =
      event === "ride:created" && !options?.skipRoomResolve
        ? resolveRideCreatedRoom(room, data)
        : room;

    const socketUrl = process.env.SOCKET_URL || "http://localhost:3001";
    const response = await fetch(`${socketUrl}/emit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: targetRoom, event, data }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to emit socket event:", error);
    return false;
  }
}

export { DRIVER_SERVICE_TYPES, getDriversRoomForServiceType, isCarpoolingRide };
