// rides.utils.ts
import { Ride } from "@/generated/prisma/client";

// ─────────────────────────────────────────────
// Distance Calculation (Haversine Formula)
// ─────────────────────────────────────────────

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─────────────────────────────────────────────
// Fare Calculation
// ─────────────────────────────────────────────

export function calculateFare(
  distanceKm: number,
  serviceType: "STANDARD" | "VIP" | "VAN",
  rideMode: "PRIVATE" | "CARPOOLING",
): number {
  const baseFare = 5;
  const perKm = 2;
  const minFare = 5;

  const serviceMultiplier = {
    STANDARD: 1,
    VIP: 2.2,
    VAN: 1.6,
  };

  const modeMultiplier = {
    PRIVATE: 1,
    CARPOOLING: 0.7,
  };

  const fare =
    (baseFare + distanceKm * perKm) *
    serviceMultiplier[serviceType] *
    modeMultiplier[rideMode];

  return Math.max(fare, minFare);
}

// ─────────────────────────────────────────────
// ML Model Fare Prediction
// ─────────────────────────────────────────────

const ML_API_URL =
  process.env.FARE_MODEL_URL ?? "http://127.0.0.1:5000/price";

export async function fetchFareFromModel(params: {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  distance: number;
  serviceType: "STANDARD" | "VIP" | "VAN";
  rideMode: "PRIVATE" | "CARPOOLING";
}): Promise<number> {
  const now = new Date();

  const features = {
    pickup_longitude: params.pickupLng,
    pickup_latitude: params.pickupLat,
    dropoff_longitude: params.dropoffLng,
    dropoff_latitude: params.dropoffLat,
    pickup_hour: now.getHours(),
    pickup_day: now.getDate(),
    pickup_month: now.getMonth() + 1,
    pickup_dayofweek: now.getDay(),
    distance: params.distance,
  };

  try {
    const res = await fetch(ML_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([features]),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!res.ok) throw new Error(`Model API returned ${res.status}`);

    const predictions: number[] = await res.json();

    if (!Array.isArray(predictions) || predictions.length === 0 || typeof predictions[0] !== "number") {
      throw new Error("Model returned invalid predictions");
    }

    const baseFare = predictions[0];

    // apply serviceType & rideMode multipliers on top of model output
    const serviceMultiplier = { STANDARD: 1, VIP: 2.2, VAN: 1.6 };
    const modeMultiplier = { PRIVATE: 1, CARPOOLING: 0.7 };

    const fare =
      baseFare *
      serviceMultiplier[params.serviceType] *
      modeMultiplier[params.rideMode];

    return Math.max(parseFloat(fare.toFixed(2)), 5);
  } catch {
    // fallback to rule-based calculation if model is unreachable
    console.warn("[fare] ML model unreachable, falling back to rule-based fare");
    return calculateFare(params.distance, params.serviceType, params.rideMode);
  }
}

const TIPS_MODEL_URL =
  process.env.TIPS_MODEL_URL ?? "http://127.0.0.1:5000/tips";

export async function fetchTipSuggestion(params: {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  distance: number;
  startedAt: Date;
}): Promise<number> {
  const t = params.startedAt;

  const features = {
    pickup_latitude: params.pickupLat,
    pickup_longitude: params.pickupLng,
    dropoff_latitude: params.dropoffLat,
    dropoff_longitude: params.dropoffLng,
    distance: params.distance,
    pickup_hour: t.getHours(),
    pickup_day: t.getDate(),
    pickup_month: t.getMonth() + 1,
    pickup_dayofweek: t.getDay(),
  };

  try {
    const res = await fetch(TIPS_MODEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([features]),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`Tips model returned ${res.status}`);

    const result: { predictions: number[] } = await res.json();

    if (!result?.predictions?.length || typeof result.predictions[0] !== "number") {
      throw new Error("Tips model returned invalid response");
    }

    return parseFloat(Math.max(result.predictions[0], 0).toFixed(2));
  } catch {
    console.warn("[tips] ML model unreachable, returning 0");
    return 0;
  }
}
// ─────────────────────────────────────────────

export function calculateEstimatedDuration(distanceKm: number): number {
  const averageSpeed = 40;
  return Math.ceil((distanceKm / averageSpeed) * 60);
}

// ─────────────────────────────────────────────
// ML Model Duration Prediction
// ─────────────────────────────────────────────

const DURATION_MODEL_URL =
  process.env.DURATION_MODEL_URL ?? "http://127.0.0.1:5000/duration";

export async function fetchDurationFromModel(params: {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  distance: number;
}): Promise<number> {
  const now = new Date();

  // تقدير أولي للمدة بناءً على 40 كم/ساعة — يُستخدم لحساب speed_haversine
  const estimatedSeconds = Math.ceil((params.distance / 40) * 3600);

  const features = {
    vendor_id: 1,
    passenger_count: 1,
    pickup_longitude: params.pickupLng,
    pickup_latitude: params.pickupLat,
    dropoff_longitude: params.dropoffLng,
    dropoff_latitude: params.dropoffLat,
    store_and_fwd_flag: 0,
    pickup_month: now.getMonth() + 1,
    pickup_day: now.getDate(),
    pickup_dayofweek: now.getDay(),
    pickup_hour: now.getHours(),
    pickup_minute: now.getMinutes(),
    pickup_second: now.getSeconds(),
    is_weekend: [0, 6].includes(now.getDay()) ? 1 : 0,
    trip_duration_seconds: estimatedSeconds,
  };

  try {
    const res = await fetch(DURATION_MODEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`Duration model returned ${res.status}`);

    const result: { trip_duration_seconds: number; trip_duration_minutes: number } =
      await res.json();

    // نرجع بالدقائق مقرّبة لأعلى
    return Math.ceil(result.trip_duration_minutes);
  } catch {
    console.warn("[duration] ML model unreachable, falling back to rule-based duration");
    return calculateEstimatedDuration(params.distance);
  }
}

// ─────────────────────────────────────────────
// Ride Mapper (DTO)
// ─────────────────────────────────────────────

export function mapRide(ride: Ride) {
  return {
    id: ride.id,
    status: ride.status,
    rideFlow: ride.rideFlow,
    rideMode: ride.rideMode,
    serviceType: ride.serviceType,

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

    // Pricing
    systemFare: ride.systemFare,
    clientOffer: ride.clientOffer,
    discountAmount: ride.discountAmount,
    finalFare: ride.finalFare,

    distance: ride.distance,
    estimatedDuration: ride.duration,
    requestedAt: ride.requestedAt,
  };
}