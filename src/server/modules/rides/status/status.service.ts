import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { emitSocketEvent } from "@/server/lib/socket/emit";
import { mapRide } from "../rides.utils";
import * as statusRepository from "./status.repository";
import { CancelRideDTO, UpdateRideStatusDTO } from "./status.schema";

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
   UPDATE STATUS
───────────────────────────── */
export async function updateRideStatusService(
    payload: Payload,
    rideId: string,
    data: UpdateRideStatusDTO
) {
    const ride = await statusRepository.findRideById(Number(rideId));

    if (!ride) throw new NotFoundError("Ride not found");

    const isClient = ride.clientId === payload.userId;
    const isDriver = ride.driver?.userId === payload.userId;
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

    const updated = await statusRepository.updateRideStatus(ride.id, updateData);

    const mapped = mapRide(updated);

    emitSocketEvent(`ride:${rideId}`, `ride:${status.toLowerCase()}`, {
        ride: mapped,
    });

    return { ride: mapped };
}

/* ─────────────────────────────
   ACCEPT RIDE
───────────────────────────── */
export async function acceptRideService(payload: Payload, rideId: string) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can accept rides");
    }

    const driver = await statusRepository.findDriverByUserId(payload.userId);

    if (!driver) throw new NotFoundError("Driver not found");

    if (!driver.isApproved) {
        throw new ForbiddenError("Driver not approved");
    }

    const result = await statusRepository.acceptRide(Number(rideId), driver.id);

    if (result.count === 0) {
        throw new ConflictError("Ride already taken or invalid state");
    }

    const ride = await statusRepository.findRideById(Number(rideId));

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
    const ride = await statusRepository.findRideById(Number(rideId));

    if (!ride) throw new NotFoundError("Ride not found");

    const isClient = ride.clientId === payload.userId;
    const isDriver = ride.driver?.userId === payload.userId;

    if (!isClient && !isDriver) {
        throw new ForbiddenError("No permission to cancel");
    }

    if (ride.status === "COMPLETED") {
        throw new BadRequestError("Cannot cancel completed ride");
    }

    if (ride.status === "CLIENT_CANCELLED") {
        throw new BadRequestError("Already cancelled");
    }

    const cancelledBy = isClient ? "CLIENT" : "DRIVER";
    const reason = data.reason || `Cancelled by ${cancelledBy}`;

    const updated = await statusRepository.updateRideStatus(ride.id, {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: `[${cancelledBy}] ${reason}`,
    });

    const mapped = mapRide(updated);

    emitSocketEvent(`ride:${rideId}`, "ride:cancelled", {
        ride: mapped,
    });

    return { ride: mapped };
}
