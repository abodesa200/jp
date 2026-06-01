import { ServiceType } from "@/generated/prisma/enums";

export const DRIVER_SERVICE_TYPES: ServiceType[] = ["STANDARD", "VIP", "VAN"];

export function isServiceType(value: unknown): value is ServiceType {
  return typeof value === "string" && DRIVER_SERVICE_TYPES.includes(value as ServiceType);
}

export function isCarpoolingRide(ride: { rideMode?: string | null }): boolean {
  return ride.rideMode === "CARPOOLING";
}

export function getDriversRoomForServiceType(serviceType: ServiceType | string): string {
  return `drivers:${serviceType}`;
}

export function resolveRideCreatedRoom(
  room: string,
  data: { ride?: { serviceType?: ServiceType | string; rideMode?: string | null } },
): string {
  if (data?.ride && isCarpoolingRide(data.ride)) {
    return "drivers";
  }

  const rideServiceType = data?.ride?.serviceType;

  if (isServiceType(rideServiceType)) {
    return getDriversRoomForServiceType(rideServiceType);
  }

  return room;
}

export async function emitRideCreatedToMatchingDrivers(
  ride: { serviceType: ServiceType | string; rideMode?: string | null },
  payload: unknown,
): Promise<boolean> {
  const { emitSocketEvent } = await import("./emit");

  // Carpooling: all online drivers join the shared "drivers" room immediately on connect
  if (isCarpoolingRide(ride)) {
    return emitSocketEvent("drivers", "ride:created", payload, { skipRoomResolve: true });
  }

  const room = getDriversRoomForServiceType(ride.serviceType);
  return emitSocketEvent(room, "ride:created", payload);
}
