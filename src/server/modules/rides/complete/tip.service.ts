import { prisma } from "@/lib/prisma";
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@/server/core/http/http-errors";
import { emitSocketEvent } from "@/server/lib/socket/emit";
import { mapRide } from "../rides.utils";

type Payload = { userId: number; role: string };

// ─────────────────────────────────────────────
// Add Tip
// ─────────────────────────────────────────────

export async function addTipService(
    payload: Payload,
    rideId: string,
    amount: number
) {
    if (payload.role !== "CLIENT") {
        throw new ForbiddenError("Only clients can add a tip");
    }

    const ride = await prisma.ride.findUnique({
        where: { id: Number(rideId) },
        include: {
            driver: { select: { id: true, userId: true, wallet: true } },
        },
    });

    if (!ride) throw new NotFoundError("Ride not found");

    if (ride.clientId !== payload.userId) {
        throw new ForbiddenError("You are not the client of this ride");
    }

    if (ride.status !== "COMPLETED") {
        throw new BadRequestError("Tip can only be added to completed rides");
    }

    if (ride.tip && Number(ride.tip) > 0) {
        throw new ConflictError("Tip already added to this ride");
    }

    if (!ride.driver) {
        throw new BadRequestError("No driver assigned to this ride");
    }

    // ── update ride tip + totalAmount
    const finalFare = Number(ride.finalFare ?? 0);
    const totalAmount = parseFloat((finalFare + amount).toFixed(2));

    const updated = await prisma.ride.update({
        where: { id: ride.id },
        data: {
            tip: amount,
            finalFare: totalAmount,
        },
    });

    // ── add tip to driver wallet
    await prisma.driverWallet.upsert({
        where: { driverId: ride.driver.id },
        create: {
            driverId: ride.driver.id,
            balance: amount,
            totalEarned: amount,
            totalDeducted: 0,
        },
        update: {
            balance: { increment: amount },
            totalEarned: { increment: amount },
        },
    });

    // ── wallet transaction record
    await prisma.walletTransaction.create({
        data: {
            wallet: { connect: { driverId: ride.driver.id } },
            amount,
            type: "PAYOUT",
            description: `Tip from ride #${rideId}`,
            rideId: ride.id,
        },
    });

    const mapped = mapRide(updated);

    // notify both sides
    emitSocketEvent(`ride:${rideId}`, "ride:tip_added", {
        ride: mapped,
        tip: amount,
        totalAmount,
    });

    return {
        ride: mapped,
        tip: amount,
        totalAmount,
    };
}
