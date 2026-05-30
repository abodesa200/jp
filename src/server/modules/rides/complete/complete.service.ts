import { prisma } from "@/lib/prisma";
import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { emitSocketEvent } from "@/server/lib/socket/emit";
import { findRideWithDetails } from "../rides.repository";
import { fetchTipSuggestion, mapRide } from "../rides.utils";

type Payload = { userId: number; role: string };

// ─────────────────────────────────────────────
// Complete Ride + Tip Suggestions + Wallet Credit
// ─────────────────────────────────────────────

export async function completeRideService(payload: Payload, rideId: string) {
    if (payload.role !== "DRIVER") {
        throw new ForbiddenError("Only drivers can complete rides");
    }

    const ride = await findRideWithDetails(Number(rideId));

    if (!ride) throw new NotFoundError("Ride not found");

    if (ride.driver?.userId !== payload.userId) {
        throw new ForbiddenError("You are not the assigned driver");
    }

    if (ride.status !== "IN_PROGRESS") {
        throw new BadRequestError("Ride must be IN_PROGRESS to complete");
    }

    // ── mark ride as COMPLETED
    const completed = await prisma.ride.update({
        where: { id: ride.id },
        data: {
            status: "COMPLETED",
            completedAt: new Date(),
        },
    });

    // ── calculate the fare to credit
    const ownerFare = Number(ride.finalFare ?? 0);
    const passengerTotal = (ride.passengers ?? []).reduce(
        (sum, passenger) => sum + Number(passenger.fare ?? 0),
        0
    );
    const fareAmount =
        ride.rideMode === "CARPOOLING"
            ? parseFloat((ownerFare + passengerTotal).toFixed(2))
            : Number(ride.finalFare ?? ride.clientOffer ?? ride.systemFare ?? 0);

    const driverId = ride.driver!.id;
    const commissionRate = Number(ride.driver!.commissionRate ?? 0.20);
    const commission = parseFloat((fareAmount * commissionRate).toFixed(2));
    const netEarnings = parseFloat((fareAmount - commission).toFixed(2));

    // ── credit driver wallet
    if (fareAmount > 0) {
        await prisma.driverWallet.upsert({
            where: { driverId },
            create: {
                driverId,
                balance: netEarnings,
                totalEarned: netEarnings,
                totalDeducted: commission,
            },
            update: {
                balance: { increment: netEarnings },
                totalEarned: { increment: netEarnings },
                totalDeducted: { increment: commission },
            },
        });

        const wallet = await prisma.driverWallet.findUnique({
            where: { driverId },
        });

        if (wallet) {
            if (netEarnings > 0) {
                await prisma.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        amount: netEarnings,
                        type: "PAYOUT",
                        description: `أجرة الرحلة #${ride.id}`,
                        rideId: ride.id,
                    },
                });
            }

            if (commission > 0) {
                await prisma.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        amount: commission,
                        type: "COMMISSION",
                        description: `عمولة الرحلة #${ride.id} (${(commissionRate * 100).toFixed(0)}%)`,
                        rideId: ride.id,
                    },
                });
            }
        }
    }

    // ── increment driver totalRides counter
    await prisma.driver.update({
        where: { id: driverId },
        data: { totalRides: { increment: 1 } },
    });

    // ── get tip suggestions from ML model
    let suggestedTips: number[] = [];

    if (ride.distance && ride.startedAt) {
        const baseTip = await fetchTipSuggestion({
            pickupLat: ride.pickupLat,
            pickupLng: ride.pickupLng,
            dropoffLat: ride.dropoffLat,
            dropoffLng: ride.dropoffLng,
            distance: ride.distance,
            startedAt: ride.startedAt,
        });

        suggestedTips = [
            parseFloat((baseTip * 0.5).toFixed(2)),
            parseFloat(baseTip.toFixed(2)),
            parseFloat((baseTip * 2).toFixed(2)),
        ].filter((v) => v > 0);
    }

    // ── fetch updated wallet balance
    const updatedWallet = await prisma.driverWallet.findUnique({
        where: { driverId },
    });

    const mapped = mapRide(completed);

    // notify both client and driver
    emitSocketEvent(`ride:${rideId}`, "ride:completed", {
        ride: mapped,
        suggestedTips,
        earnings: {
            fare: fareAmount,
            commission,
            net: netEarnings,
        },
    });

    return {
        ride: mapped,
        suggestedTips,
        earnings: {
            fare: fareAmount,
            commission,
            net: netEarnings,
        },
        wallet: updatedWallet
            ? {
                  balance: Number(updatedWallet.balance),
                  totalEarned: Number(updatedWallet.totalEarned),
              }
            : null,
    };
}
