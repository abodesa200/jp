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

async function creditDriverTip(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    driverId: number,
    rideId: number,
    tipAmount: number,
) {
    if (tipAmount <= 0) return;

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
                description: `بخشيش الرحلة #${rideId} (بدون عمولة)`,
                rideId,
            },
        });
    }
}

// ─────────────────────────────────────────────
// Client submits tip (amount = 0 means declined)
// Ride owner and carpool passengers can each tip independently
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

    if (ride.status !== "COMPLETED") {
        throw new BadRequestError("Tip can only be added to completed rides");
    }

    const isOwner = ride.clientId === payload.userId;
    const passenger = ride.passengers?.find(
        (entry) => entry.clientId === payload.userId,
    );
    const isPassenger = Boolean(passenger);

    if (!isOwner && !isPassenger) {
        throw new ForbiddenError("You are not part of this ride");
    }

    if (isOwner && ride.tipSubmittedAt) {
        throw new ConflictError("Tip has already been submitted for this ride");
    }

    if (isPassenger && passenger!.tipSubmittedAt) {
        throw new ConflictError("Tip has already been submitted for this ride");
    }

    const tipAmount = parseFloat(Math.max(amount, 0).toFixed(2));
    const driverId = ride.driverId;

    await prisma.$transaction(async (tx) => {
        if (isOwner) {
            await tx.ride.update({
                where: { id: ride.id },
                data: {
                    tip: tipAmount,
                    tipSubmittedAt: new Date(),
                },
            });
        } else {
            await tx.ridePassenger.update({
                where: { id: passenger!.id },
                data: {
                    tip: tipAmount,
                    tipSubmittedAt: new Date(),
                },
            });
        }

        if (tipAmount > 0 && driverId) {
            await creditDriverTip(tx, driverId, ride.id, tipAmount);
        }
    });

    const updatedRide = await prisma.ride.findUnique({
        where: { id: ride.id },
        include: { passengers: true },
    });

    if (!updatedRide) throw new NotFoundError("Ride not found");

    emitSocketEvent(`ride:${rideId}`, "ride:tip", {
        rideId: ride.id,
        clientId: payload.userId,
        tip: tipAmount,
        paid: tipAmount > 0,
        isPassenger,
    });

    return {
        ride: mapRide(updatedRide),
        tip: tipAmount,
        paid: tipAmount > 0,
    };
}
