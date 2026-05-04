/**
 * Ride Creation Service
 * Handles ride creation logic
 */

import { ForbiddenError } from "../../../core/errors";
import { emitSocketEvent } from "@/lib/socket/emit";
import { rideRepository } from "../ride.repository";
import { CreateRideInput } from "../ride.types";
import { calculateDistance, calculateFare, calculateEstimatedDuration } from "../utils/ride-calculations";
import { formatRideDetails } from "../utils/ride-formatter";

export async function createRide(userId: number, role: string, data: CreateRideInput) {
  if (role !== "CLIENT") {
    throw new ForbiddenError("Only clients can request rides");
  }

  const {
    pickupLat,
    pickupLng,
    pickupAddress,
    dropoffLat,
    dropoffLng,
    dropoffAddress,
    type,
    maxPassengers = 1,
  } = data;

  const distance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
  const systemFare = calculateFare(distance);
  const estimatedDuration = calculateEstimatedDuration(distance);

  const ride = await rideRepository.create({
    clientId: userId,
    pickupLat,
    pickupLng,
    pickupAddress,
    dropoffLat,
    dropoffLng,
    dropoffAddress,
    type,
    maxPassengers,
    availableSeats: maxPassengers,
    systemFare,
    distance,
    duration: estimatedDuration,
    status: "REQUESTED",
  });

  // Notify all online drivers
  emitSocketEvent("drivers", "ride:created", {
    ride: formatRideDetails(ride),
  });

  return {
    ride: formatRideDetails(ride),
  };
}
