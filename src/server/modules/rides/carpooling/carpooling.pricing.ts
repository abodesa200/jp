import { prisma } from "@/lib/prisma";

export function calculateCarpoolShare(totalFare: number, participantCount: number) {
  if (participantCount <= 0 || totalFare <= 0) return 0;
  return parseFloat((totalFare / participantCount).toFixed(2));
}

export function calculateCarpoolTotalEarnings(
  ownerShare: number,
  passengers: { fare: unknown }[]
) {
  const passengerTotal = passengers.reduce(
    (sum, passenger) => sum + Number(passenger.fare ?? 0),
    0
  );
  return parseFloat((ownerShare + passengerTotal).toFixed(2));
}

export async function recalculateCarpoolFares(rideId: number) {
  return prisma.$transaction(async (tx) => {
    const ride = await tx.ride.findUnique({
      where: { id: rideId },
      include: {
        passengers: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!ride || ride.rideMode !== "CARPOOLING") {
      return null;
    }

    const totalFare = Number(ride.systemFare ?? 0);
    const participantCount = 1 + ride.passengers.length;
    const share = calculateCarpoolShare(totalFare, participantCount);

    await tx.ride.update({
      where: { id: rideId },
      data: { finalFare: share },
    });

    for (const passenger of ride.passengers) {
      await tx.ridePassenger.update({
        where: { id: passenger.id },
        data: { fare: share },
      });
    }

    const updatedRide = await tx.ride.findUnique({
      where: { id: rideId },
      include: {
        passengers: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!updatedRide) return null;

    const totalEarnings = calculateCarpoolTotalEarnings(
      Number(updatedRide.finalFare ?? 0),
      updatedRide.passengers
    );

    return {
      ride: updatedRide,
      share,
      totalEarnings,
      participantCount,
    };
  });
}
