import { prisma } from "@/lib/prisma";
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { emitSocketEvent } from "@/server/lib/socket/emit";
import { findRideWithDetails } from "../rides.repository";
import { mapRide } from "../rides.utils";

type Payload = { userId: number; role: string };

// ─────────────────────────────────────────────
// Client submits tip (amount = 0 means declined)
// Credits driver wallet 100% — no commission
// ─────────────────────────────────────────────

export async function addTipService(
    payload: Payload,
    rideId: string,
    amount: number,
) {
    if (payload.role !== "CLIENT") {
        throw new ForbiddenError("Only clients can add a tip");
    }

    const ride = await findRideWithDetails(Number(rideId));

    if (!ride) throw new NotFoundError("Ride not found");

    if (ride.clientId !== payload.userId) {
        throw new ForbiddenError("You are not the ride client");
    }

    if (ride.status !== "COMPLETED") {
        throw new BadRequestError("Tip can only be added to completed rides");
    }

    if (ride.tipSubmittedAt) {
        throw new ConflictError("Tip has already been submitted for this ride");
    }

    const tipAmount = parseFloat(Math.max(amount, 0).toFixed(2));
    const driverId = ride.driverId;

    await prisma.$transaction(async (tx) => {
        await tx.ride.update({
            where: { id: ride.id },
            data: {
                tip: tipAmount,
                tipSubmittedAt: new Date(),
            },
        });

        if (tipAmount > 0 && driverId) {
            await tx.driverWallet.upsert({
                where: { driverId },
                create: {
                    driverId,
                    balance: tipAmount,
                    totalEarned: tipAmount,
                    totalDeducted: 0,
                },
                update: {
                    balance: { increment: tipAmount },
                    totalEarned: { increment: tipAmount },
                },
            });

            const wallet = await tx.driverWallet.findUnique({
                where: { driverId },
            });

            if (wallet) {
                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        amount: tipAmount,
                        type: "TIP",
                        description: `بخشيش الرحلة #${ride.id} (بدون عمولة)`,
                        rideId: ride.id,
                    },
                });
            }
        }
    });

    const updatedRide = await prisma.ride.findUnique({
        where: { id: ride.id },
        include: { passengers: true },
    });

    if (!updatedRide) throw new NotFoundError("Ride not found");

    emitSocketEvent(`ride:${rideId}`, "ride:tip", {
        rideId: ride.id,
        tip: tipAmount,
        paid: tipAmount > 0,
    });

    return {
        ride: mapRide(updatedRide),
        tip: tipAmount,
        paid: tipAmount > 0,
    };
}
