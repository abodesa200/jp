import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import { emitSocketEvent } from "@/lib/socket/emit";
import { CancelRideDTO, UpdateRideStatusDTO } from "./ride.schema";

type Payload = {
  userId: number;
  role: string;
};

/* ─────────────────────────────
   STATE MACHINE
───────────────────────────── */
const allowedTransitions: Record<string, string[]> = {
  REQUESTED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

/* ─────────────────────────────
   ROLE VALIDATION
───────────────────────────── */
function validateRoleForStatus(
  status: string,
  ctx: { isClient: boolean; isDriver: boolean; isAdmin: boolean }
) {
  const { isClient, isDriver, isAdmin } = ctx;

  if (isAdmin) return;

  if (["ACCEPTED", "IN_PROGRESS", "COMPLETED"].includes(status) && !isDriver) {
    throw new ForbiddenError("Only driver can perform this action");
  }

  if (status === "CANCELLED" && !isClient && !isDriver) {
    throw new ForbiddenError("Not allowed to cancel ride");
  }
}

/* ─────────────────────────────
   MAPPER (DTO)
───────────────────────────── */
function mapRide(ride: any) {
  return {
    id: ride.id,
    status: ride.status,

    pickup: {
      lat: ride.pickupLat,
      lng: ride.pickupLng,
      address: ride.pickupAddress,
    },

    dropoff: {
      lat: ride.dropoffLat,
      lng: ride.dropoffLng,
      address: ride.dropoffAddress,
    },

    systemFare: ride.systemFare,
    distance: ride.distance,
    estimatedDuration: ride.duration,
    type: ride.type,
    requestedAt: ride.requestedAt,
  };
}

/* ─────────────────────────────
   UPDATE STATUS
───────────────────────────── */
export async function updateRideStatusService(
  payload: Payload,
  rideId: string,
  data: UpdateRideStatusDTO
) {
  const ride = await prisma.ride.findUnique({
    where: { id: Number(rideId) },
  });

  if (!ride) throw new NotFoundError("Ride not found");

  const isClient = ride.clientId === payload.userId;
  const isDriver = ride.driverId === payload.userId;
  const isAdmin = payload.role === "ADMIN";

  if (!isClient && !isDriver && !isAdmin) {
    throw new ForbiddenError("No access to this ride");
  }

  const { status, cancelReason } = data;

  // state validation
  if (!allowedTransitions[ride.status].includes(status)) {
    throw new BadRequestError("Invalid status transition");
  }

  // role validation
  validateRoleForStatus(status, { isClient, isDriver, isAdmin });

  const updateData: any = { status };

  if (status === "ACCEPTED") updateData.acceptedAt = new Date();
  if (status === "IN_PROGRESS") updateData.startedAt = new Date();
  if (status === "COMPLETED") updateData.completedAt = new Date();

  if (status === "CANCELLED") {
    updateData.cancelledAt = new Date();
    if (cancelReason) updateData.cancelReason = cancelReason;
  }

  const updated = await prisma.ride.update({
    where: { id: ride.id },
    data: updateData,
  });

  const mapped = mapRide(updated);

  emitSocketEvent(`ride:${rideId}`, `ride:${status.toLowerCase()}`, {
    ride: mapped,
  });

  return { ride: mapped };
}

/* ─────────────────────────────
   ACCEPT RIDE
───────────────────────────── */
export async function acceptRideService(
  payload: Payload,
  rideId: string
) {
  if (payload.role !== "DRIVER") {
    throw new ForbiddenError("Only drivers can accept rides");
  }

  const driver = await prisma.driver.findUnique({
    where: { userId: payload.userId },
  });

  if (!driver) throw new NotFoundError("Driver not found");

  if (!driver.isApproved) {
    throw new ForbiddenError("Driver not approved");
  }

  // IMPORTANT: no isOnline DB dependency

  const result = await prisma.ride.updateMany({
    where: {
      id: Number(rideId),
      status: "REQUESTED",
      driverId: null,
    },
    data: {
      driverId: driver.id,
      status: "ACCEPTED",
      acceptedAt: new Date(),
    },
  });

  if (result.count === 0) {
    throw new ConflictError("Ride already taken or invalid state");
  }

  const ride = await prisma.ride.findUnique({
    where: { id: Number(rideId) },
  });

  if (!ride) throw new NotFoundError("Ride not found");

  const mapped = mapRide(ride);

  emitSocketEvent(`ride:${rideId}`, "ride:accepted", {
    ride: mapped,
  });

  return { ride: mapped };
}

/* ─────────────────────────────
   CANCEL RIDE
───────────────────────────── */
export async function cancelRideService(
  payload: Payload,
  rideId: string,
  data: CancelRideDTO
) {
  const ride = await prisma.ride.findUnique({
    where: { id: Number(rideId) },
  });

  if (!ride) throw new NotFoundError("Ride not found");

  const isClient = ride.clientId === payload.userId;
  const isDriver = ride.driverId === payload.userId;

  if (!isClient && !isDriver) {
    throw new ForbiddenError("No permission to cancel");
  }

  if (ride.status === "COMPLETED") {
    throw new BadRequestError("Cannot cancel completed ride");
  }

  if (ride.status === "CANCELLED") {
    throw new BadRequestError("Already cancelled");
  }

  const cancelledBy = isClient ? "CLIENT" : "DRIVER";
  const reason = data.reason || `Cancelled by ${cancelledBy}`;

  const updated = await prisma.ride.update({
    where: { id: ride.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelReason: `[${cancelledBy}] ${reason}`,
    },
  });

  const mapped = mapRide(updated);

  emitSocketEvent(`ride:${rideId}`, "ride:cancelled", {
    ride: mapped,
  });

  return { ride: mapped };
}